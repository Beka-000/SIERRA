"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Table from "../components/ui/Table";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

interface Review {
  id: string;
  rating: number;
  text: string | null;
  status: "pending" | "approved" | "rejected" | "hidden";
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  product: {
    id: string;
    title: string;
  } | null;
  order: {
    id: string;
    orderNumber: string;
  } | null;
  moderator: {
    id: string;
    name: string;
  } | null;
  moderatedAt: string | null;
  rejectionReason: string | null;
  userAvatar: string | null;
}

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [ratingFilter, setRatingFilter] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [moderateModalOpen, setModerateModalOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | "hide" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (ratingFilter) params.set("rating", ratingFilter);

      const res = await fetch(`/api/admin/reviews?${params}`);
      const data = await res.json();

      if (res.ok) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Ошибка загрузки отзывов:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [search, statusFilter, ratingFilter]);

  const handleModerate = async () => {
    if (!selectedReview || !action) return;
    if (action === "reject" && !rejectionReason.trim()) {
      alert("Укажите причину отклонения");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/reviews/${selectedReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejectionReason: action === "reject" ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setModerateModalOpen(false);
        setSelectedReview(null);
        setAction(null);
        setRejectionReason("");
        fetchReviews();
      } else {
        alert(data.message || "Ошибка модерации");
      }
    } catch (error) {
      console.error("Ошибка модерации:", error);
      alert("Ошибка модерации отзыва");
    } finally {
      setActionLoading(false);
    }
  };

  const openModerateModal = (review: Review, actionType: "approve" | "reject" | "hide") => {
    setSelectedReview(review);
    setAction(actionType);
    setModerateModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">На модерации</Badge>;
      case "approved":
        return <Badge variant="success">Одобрен</Badge>;
      case "rejected":
        return <Badge variant="error">Отклонён</Badge>;
      case "hidden":
        return <Badge variant="default">Скрыт</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={i < rating ? "#c9a96e" : "none"}
            stroke="#c9a96e"
            strokeWidth="2"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  const columns = [
    {
      key: "user",
      label: "Автор",
      render: (r: Review) => (
        <div className="flex items-center gap-2">
          {r.userAvatar ? (
            <img src={r.userAvatar} alt={r.user?.name || "User"} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center text-[#c9a96e] text-xs">
              {r.user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div className="text-sm">
            <div className="text-white">{r.user?.name || "Аноним"}</div>
            <div className="text-white/40 text-xs">{r.user?.email || "—"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "rating",
      label: "Рейтинг",
      render: (r: Review) => renderStars(r.rating),
    },
    {
      key: "text",
      label: "Отзыв",
      render: (r: Review) => (
        <div className="max-w-md">
          <div className="text-sm text-white line-clamp-2">
            {r.text || <span className="text-white/40">Без текста</span>}
          </div>
          {r.product && (
            <div className="text-xs text-white/40 mt-1">О товаре: {r.product.title}</div>
          )}
        </div>
      ),
    },
    {
      key: "date",
      label: "Дата",
      render: (r: Review) => (
        <div className="text-xs text-white/60">
          {new Date(r.createdAt).toLocaleDateString("ru-RU")}
        </div>
      ),
    },
    {
      key: "status",
      label: "Статус",
      render: (r: Review) => (
        <div>
          {getStatusBadge(r.status)}
          {r.status === "rejected" && r.rejectionReason && (
            <div className="text-xs text-red-400 mt-1 max-w-xs line-clamp-1">
              {r.rejectionReason}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Действия",
      render: (r: Review) => (
        <div className="flex flex-col gap-1">
          {r.status === "pending" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openModerateModal(r, "approve");
                }}
                className="text-green-400 hover:text-green-300 text-sm transition"
              >
                Одобрить
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openModerateModal(r, "reject");
                }}
                className="text-red-400 hover:text-red-300 text-sm transition"
              >
                Отклонить
              </button>
            </>
          )}
          {r.status === "approved" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModerateModal(r, "hide");
              }}
              className="text-yellow-400 hover:text-yellow-300 text-sm transition"
            >
              Скрыть
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/reviews/${r.id}`);
            }}
            className="text-[#c9a96e] hover:text-[#d4b882] text-sm transition"
          >
            Открыть
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Отзывы</h1>
        <p className="text-white/60">Модерация отзывов клиентов</p>
      </div>

      {/* Фильтры */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Поиск по тексту или автору..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Все статусы</option>
            <option value="pending">На модерации</option>
            <option value="approved">Одобренные</option>
            <option value="rejected">Отклонённые</option>
            <option value="hidden">Скрытые</option>
          </Select>
          <Select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
            <option value="">Все рейтинги</option>
            <option value="5">5 звёзд</option>
            <option value="4">4 звезды</option>
            <option value="3">3 звезды</option>
            <option value="2">2 звезды</option>
            <option value="1">1 звезда</option>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatusFilter("pending");
              setRatingFilter("");
            }}
          >
            Сбросить фильтры
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {["pending", "approved", "rejected", "hidden"].map((status) => {
          const count = reviews.filter((r) => r.status === status).length;
          return (
            <div
              key={status}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 cursor-pointer hover:bg-white/[0.06] transition"
              onClick={() => setStatusFilter(status)}
            >
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className="text-sm text-white/60">
                {status === "pending"
                  ? "На модерации"
                  : status === "approved"
                  ? "Одобрено"
                  : status === "rejected"
                  ? "Отклонено"
                  : "Скрыто"}
              </div>
            </div>
          );
        })}
      </div>

      <Table
        columns={columns}
        data={reviews}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyMessage="Отзывы не найдены"
      />

      {/* Модальное окно модерации */}
      <Modal
        isOpen={moderateModalOpen}
        onClose={() => {
          setModerateModalOpen(false);
          setSelectedReview(null);
          setAction(null);
          setRejectionReason("");
        }}
        title={
          action === "approve"
            ? "Одобрить отзыв"
            : action === "reject"
            ? "Отклонить отзыв"
            : "Скрыть отзыв"
        }
      >
        <div className="space-y-4">
          {selectedReview && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1">
                  <div className="font-medium text-white mb-1">
                    {selectedReview.user?.name || "Аноним"}
                  </div>
                  {renderStars(selectedReview.rating)}
                </div>
              </div>
              <div className="text-white/80 text-sm">{selectedReview.text || "Без текста"}</div>
              {selectedReview.product && (
                <div className="text-xs text-white/40 mt-2">
                  Товар: {selectedReview.product.title}
                </div>
              )}
            </div>
          )}

          {action === "approve" && (
            <p className="text-white/60">
              Отзыв будет опубликован на сайте и станет доступен всем пользователям.
            </p>
          )}

          {action === "reject" && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Причина отклонения *
              </label>
              <textarea
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition resize-none"
                rows={3}
                placeholder="Укажите причину отклонения..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          )}

          {action === "hide" && (
            <p className="text-white/60">
              Отзыв будет скрыт с сайта, но останется в базе данных.
            </p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setModerateModalOpen(false);
                setSelectedReview(null);
                setAction(null);
                setRejectionReason("");
              }}
              disabled={actionLoading}
            >
              Отмена
            </Button>
            <Button
              onClick={handleModerate}
              disabled={(action === "reject" && !rejectionReason.trim()) || actionLoading}
            >
              {actionLoading
                ? "Обработка..."
                : action === "approve"
                ? "Одобрить"
                : action === "reject"
                ? "Отклонить"
                : "Скрыть"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
