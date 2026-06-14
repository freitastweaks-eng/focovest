import { useEffect, useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

interface LofyPayPixCheckoutProps {
  paymentCode: string;
  paymentCodeBase64: string;
  idTransaction: string;
  externalReference: string;
  status: string;
  onRefreshStatus: () => Promise<void>;
}

export function LofyPayPixCheckout({
  paymentCode,
  paymentCodeBase64,
  idTransaction,
  externalReference,
  status,
  onRefreshStatus,
}: LofyPayPixCheckoutProps) {
  const [copied, setCopied] = useState(false);
  const [generatedQrCode, setGeneratedQrCode] = useState("");
  const isPaid = status === "PAID";

  useEffect(() => {
    let active = true;
    if (paymentCodeBase64 || !paymentCode) {
      setGeneratedQrCode("");
      return;
    }

    QRCode.toDataURL(paymentCode, {
      width: 320,
      margin: 2,
      color: { dark: "#06101f", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (active) setGeneratedQrCode(url);
      })
      .catch(() => {
        if (active) setGeneratedQrCode("");
      });

    return () => {
      active = false;
    };
  }, [paymentCode, paymentCodeBase64]);

  const qrCodeSource = paymentCodeBase64
    ? paymentCodeBase64.startsWith("http") || paymentCodeBase64.startsWith("data:")
      ? paymentCodeBase64
      : `data:image/png;base64,${paymentCodeBase64}`
    : generatedQrCode;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(paymentCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Pagamento PIX</h3>
          <p className="text-sm text-muted-foreground">
            Use o QR Code ou copie o código PIX abaixo.
          </p>
        </div>
        <Button onClick={onRefreshStatus} size="sm" className="gap-2" disabled={isPaid}>
          <RefreshCw className="size-4" /> Atualizar status
        </Button>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <div className="flex min-h-72 items-center justify-center rounded-3xl border border-border bg-white p-4">
          {qrCodeSource ? (
            <img
              src={qrCodeSource}
              alt="QR Code PIX"
              className="mx-auto aspect-square w-full max-w-72 object-contain"
            />
          ) : (
            <div className="max-w-56 text-center text-sm text-muted-foreground">
              QR Code indisponível. Use o código PIX copia-e-cola.
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</div>
            <div
              className={
                isPaid
                  ? "mt-2 text-xl font-semibold text-lime"
                  : "mt-2 text-xl font-semibold text-foreground"
              }
            >
              {isPaid ? "Plano ativo" : status}
            </div>
            {isPaid && (
              <p className="mt-2 text-sm text-muted-foreground">
                Pagamento confirmado. Os beneficios do plano ja foram liberados na sua conta.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Código PIX
            </div>
            <div className="mt-2 max-h-36 overflow-auto break-all rounded-xl bg-background/60 p-3 font-mono text-xs leading-relaxed">
              {paymentCode}
            </div>
            <Button onClick={copyCode} className="mt-4">
              <Copy className="size-4" /> {copied ? "Copiado" : "Copiar código"}
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
            <div className="font-semibold text-foreground">Transação</div>
            <div className="mt-2">ID: {idTransaction}</div>
            <div className="mt-2">Ref: {externalReference}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
