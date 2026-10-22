import { redirect } from "next/navigation";

// /admin/menu не имеет собственного содержимого — редиректим на товары
export default function AdminMenuPage() {
  redirect("/admin/menu/products");
}
