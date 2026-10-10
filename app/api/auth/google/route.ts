import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth";

const googleClientId = process.env.GOOGLE_CLIENT_ID;

if (!googleClientId) {
  throw new Error("GOOGLE_CLIENT_ID is not configured");
}

const client = new OAuth2Client(googleClientId);

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json();

    // Google credential барбы?
    if (!credential) {
      return NextResponse.json(
        {
          success: false,
          error: "No Google credential provided",
        },
        { status: 400 }
      );
    }

    // Google ID token текшерүү
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    // Google маалыматтарын текшерүү
    if (!payload || !payload.sub || !payload.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Google token",
        },
        { status: 400 }
      );
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email.split("@")[0];
    const avatar = payload.picture || null;

    // ------------------------------------------------
    // 1. Google ID боюнча user издөө
    // ------------------------------------------------

    let user = await prisma.user.findUnique({
      where: {
        googleId,
      },
      include: {
        role: true,
      },
    });

    // ------------------------------------------------
    // 2. User жок болсо
    // ------------------------------------------------

    if (!user) {
      // Email боюнча user барбы?
      const existingEmailUser = await prisma.user.findUnique({
        where: {
          email,
        },
        include: {
          role: true,
        },
      });

      // ------------------------------------------------
      // 3. Email менен аккаунт мурунтан бар
      // ------------------------------------------------

      if (existingEmailUser) {
        user = await prisma.user.update({
          where: {
            id: existingEmailUser.id,
          },
          data: {
            googleId,
            googleAvatar: avatar,
          },
          include: {
            role: true,
          },
        });
      }

      // ------------------------------------------------
      // 4. Жаңы user түзүү
      // ------------------------------------------------

      else {
        const clientRole = await prisma.role.findUnique({
          where: {
            code: "client",
          },
        });

        if (!clientRole) {
          return NextResponse.json(
            {
              success: false,
              error: "Client role not found in database",
            },
            { status: 500 }
          );
        }

        user = await prisma.user.create({
          data: {
            name,
            email,
            googleId,
            googleAvatar: avatar,

            phone: null,
            passwordHash: null,

            roleId: clientRole.id,

            notificationsConsent: false,
          },
          include: {
            role: true,
          },
        });

        // Profile түзүү
        await prisma.profile.create({
          data: {
            userId: user.id,
          },
        });
      }
    }

    // ------------------------------------------------
    // 5. Аккаунт блоктолгонбу?
    // ------------------------------------------------

    if (user.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          error: "Account is blocked",
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------
    // 6. Avatar жаңыртуу
    // ------------------------------------------------

    if (avatar && avatar !== user.googleAvatar) {
      user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          googleAvatar: avatar,
        },
        include: {
          role: true,
        },
      });
    }

    // ------------------------------------------------
    // 7. Session түзүү
    // ------------------------------------------------

    const sessionToken = await createSession({
      userId: user.id,
      role: user.role.code,
      name: user.name,
      email: user.email,
    });

    // ------------------------------------------------
    // 8. Cookie коюу
    // ------------------------------------------------

    await setSessionCookie(sessionToken);

    // ------------------------------------------------
    // 9. Frontend'ге жооп
    // ------------------------------------------------

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.code,
        avatar: user.googleAvatar,
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to authenticate with Google",
      },
      { status: 500 }
    );
  }
}
