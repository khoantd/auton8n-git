import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface QrPaymentCardProps {
  heading?: string;
  description?: string;
  /**
   * Public path to the QR image.
   * Place your PNG file under the Vite `public` folder and reference it here.
   * Example: "/qr-payment-acb.png"
   */
  imageSrc?: string;
}

export const QrPaymentCard = ({
  heading = "QR code payment",
  description = "Scan this VietQR code with your banking app to pay securely.",
  imageSrc = "/qr-payment-acb.png",
}: QrPaymentCardProps) => {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold">{heading}</CardTitle>
        <CardDescription className="space-y-1">
          <p>{description}</p>
          <p className="text-xs text-muted-foreground">
            Account: <span className="font-medium">TRAN NGOC DUY</span> —{" "}
            <span className="font-mono">82239599</span> (ACB)
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl border border-border bg-background/60 p-4 shadow-sm">
            <img
              src={imageSrc}
              alt="QR code for bank transfer to TRAN NGOC DUY"
              className="h-auto w-full max-w-xs rounded-xl bg-white"
            />
          </div>
          <p className="text-center text-xs text-muted-foreground max-w-sm">
            After scanning, please confirm the recipient name and account number above before
            completing the transfer.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

