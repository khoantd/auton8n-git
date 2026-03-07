import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { Trash2, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CartSheet() {
    const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, total } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        setIsOpen(false);
        navigate("/payment");
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" /> Shopping Cart
                    </SheetTitle>
                    <SheetDescription>
                        Review your selected items before checkout.
                    </SheetDescription>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                        <ShoppingCart className="h-12 w-12 opacity-20" />
                        <p>Your cart is empty</p>
                        <Button variant="link" onClick={() => setIsOpen(false)}>
                            Continue Shopping
                        </Button>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 -mx-6 px-6 my-4">
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex flex-wrap gap-4">
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <h4 className="font-medium leading-none">{item.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {item.description}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Qty:</span>
                                                <div className="flex items-center rounded-md border border-border">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                        aria-label="Decrease quantity"
                                                    >
                                                        -
                                                    </Button>
                                                    <span className="px-2 w-8 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        aria-label="Increase quantity"
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                                <span>
                                                    × ${item.price}
                                                    {item.interval && <span className="text-xs text-muted-foreground">/{item.interval}</span>}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="font-bold">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="space-y-4 mt-auto">
                            <Separator />
                            <div className="flex justify-between text-lg font-semibold">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <SheetFooter>
                                <Button className="w-full" onClick={handleCheckout}>
                                    Proceed to Checkout
                                </Button>
                            </SheetFooter>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
