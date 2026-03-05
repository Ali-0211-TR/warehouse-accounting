import { emptyCard, useCardStore } from "@/entities/card";
import type { ClientEntity } from "@/entities/client";
import { useLimitStore } from "@/entities/limit";
import type { CardEntity } from "@/shared/bindings/CardEntity";
import type { LimitDTO } from "@/shared/bindings/dtos/LimitDTO";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ClientCardsDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientEntity | null;
}

export function ClientCardsDialog({
  open,
  onClose,
  client,
}: ClientCardsDialogProps) {
  const { t } = useTranslation();
  const [cards, setCards] = useState<CardEntity[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [cardToDelete, setCardToDelete] = useState<CardEntity | null>(null);

  const selectedCard = cards[selectedCardIndex] || null;

  const goToPrevious = () => {
    setSelectedCardIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setSelectedCardIndex(prev => Math.min(cards.length - 1, prev + 1));
  };

  const {
    getCardsByClientId,
    saveCard,
    deleteCard,
    loading: cardsLoading,
  } = useCardStore();
  const {
    loadLimitsByCardId,
    saveLimit,
    deleteLimit,
    loading: limitsLoading,
  } = useLimitStore();

  useEffect(() => {
    if (open && client?.id) {
      loadCards();
    }
  }, [open, client?.id]);

  useEffect(() => {
    if (selectedCard?.id) {
      loadLimitsByCardId(selectedCard.id);
    }
  }, [selectedCard?.id]);

  const loadCards = async () => {
    if (!client?.id) return;
    try {
      const clientCards = await getCardsByClientId(client.id, true);
      setCards(clientCards);
      if (clientCards.length > 0 && selectedCardIndex >= clientCards.length) {
        setSelectedCardIndex(0);
      }
    } catch (error) {
      console.error("Failed to load cards:", error);
    }
  };

  const getCardStateColor = (state: string) => {
    switch (state) {
      case "Ready":
        return "bg-green-100 text-green-800 border-green-300";
      case "Blocked":
        return "bg-red-100 text-red-800 border-red-300";
      case "Pour":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getLimitTypeColor = (type: string) => {
    switch (type) {
      case "Unlimited":
        return "bg-green-100 text-green-800";
      case "LimitVolume":
        return "bg-blue-100 text-blue-800";
      case "LimitSumm":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddCard = async () => {
    if (!client?.id) return;
    try {
      const newCard: CardEntity = {
        ...emptyCard,
        client: client, // Pass the full client entity
        name: `${t("card.new_card")} ${cards.length + 1}`,
        comment: "",
      };
      await saveCard(newCard);
      await loadCards();
      setSelectedCardIndex(cards.length); // Go to the newly added card
    } catch (error) {
      console.error("Failed to create card:", error);
    }
  };

  const handleAddLimit = async () => {
    if (!selectedCard?.id) return;
    try {
      const newLimit: LimitDTO = {
        id: null,
        device_id: "",
        card_id: selectedCard.id,
        limit_type: "Unlimited",
        product_id: null,
        d_begin: new Date().toISOString(),
        d_end: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        ).toISOString(),
        include_holidays: true,
        limit_value: 0,
        discount_id: null,
        comment: "",
        created_at: "",
        updated_at: "",
        deleted_at: null,
        version: BigInt(0),
      };
      await saveLimit(newLimit);
      await loadCards();
    } catch (error) {
      console.error("Failed to create limit:", error);
    }
  };

  const handleDeleteLimit = async (limitId: string) => {
    if (!limitId) return;
    try {
      await deleteLimit(limitId);
      await loadCards();
    } catch (error) {
      console.error("Failed to delete limit:", error);
    }
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete?.id) return;
    try {
      await deleteCard(cardToDelete.id);
      setCardToDelete(null);
      // Adjust selected index after deletion
      if (selectedCardIndex >= cards.length - 1 && selectedCardIndex > 0) {
        setSelectedCardIndex(selectedCardIndex - 1);
      }
      await loadCards();
    } catch (error) {
      console.error("Failed to delete card:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t("client.manage_cards")} - {client?.name}
              </DialogTitle>
              <DialogDescription>
                {t("client.manage_cards_description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {cardsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p>{t("client.no_cards")}</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={handleAddCard}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("client.add_card")}
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Carousel Header with Navigation */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToPrevious}
                    disabled={selectedCardIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        {selectedCard?.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("client.card")} {selectedCardIndex + 1}{" "}
                        {t("common.of")} {cards.length}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToNext}
                    disabled={selectedCardIndex === cards.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getCardStateColor(selectedCard?.state || "")}
                  >
                    {t(`lists.card_state.${selectedCard?.state}`)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setCardToDelete(selectedCard)}
                    title={t("control.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Card Content */}
              {selectedCard && (
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-4 pb-4">
                    {/* Card Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {t("client.card_details")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {t("card.valid_from")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(
                                selectedCard.d_begin
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {t("card.valid_to")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(
                                selectedCard.d_end
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {selectedCard.comment && (
                          <div className="col-span-2">
                            <p className="text-sm font-medium">
                              {t("common.comment")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {selectedCard.comment}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Limits */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">
                          {t("client.card_limits")}
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddLimit}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t("limit.add_limit")}
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {limitsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : !selectedCard.limits ||
                          selectedCard.limits.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>{t("limit.no_limits")}</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {[...selectedCard.limits]
                              .sort((a: any, b: any) => {
                                // Sort by id in descending order (newest first)
                                return (b.id || 0) - (a.id || 0);
                              })
                              .map((limit: any) => (
                                <div
                                  key={limit.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge
                                        className={getLimitTypeColor(
                                          limit.limit_type
                                        )}
                                      >
                                        {t(
                                          `lists.limit_type.${limit.limit_type}`
                                        )}
                                      </Badge>
                                      {limit.product && (
                                        <span className="text-sm text-muted-foreground">
                                          {limit.product.name}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(
                                          limit.d_begin
                                        ).toLocaleDateString()}{" "}
                                        -{" "}
                                        {new Date(
                                          limit.d_end
                                        ).toLocaleDateString()}
                                      </span>
                                      {limit.limit_type !== "Unlimited" && (
                                        <span className="flex items-center gap-1">
                                          {/* <DollarSign className="h-3 w-3" /> */}
                                          {limit.limit_value.toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                    {limit.comment && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {limit.comment}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() =>
                                      limit.id && handleDeleteLimit(limit.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCard}
            disabled={cardsLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("client.add_card")}
          </Button>
          <Button onClick={onClose}>{t("control.close")}</Button>
        </div>
      </DialogContent>

      <ConfirmationDialog
        open={!!cardToDelete}
        onCancel={() => setCardToDelete(null)}
        onConfirm={handleDeleteCard}
        title={t("card.delete_card")}
        description={t("card.delete_card_confirmation", {
          name: cardToDelete?.name || "",
        })}
        confirmLabel={t("control.delete")}
        cancelLabel={t("control.cancel")}
        confirmClassName="bg-red-600 hover:bg-red-700"
      />
    </Dialog>
  );
}
