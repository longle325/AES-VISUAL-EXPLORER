import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, FileOutput } from "lucide-react";
import { StateMatrix } from "./StateMatrix";
import { toBase64, toHex, bytesToState } from "@/lib/aes";
import { useToast } from "@/hooks/use-toast";

interface OutputPanelProps {
  ciphertext: Uint8Array;
  finalState: number[][];
}

export const OutputPanel = ({ ciphertext, finalState }: OutputPanelProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const hex = toHex(ciphertext, " ");
  const b64 = toBase64(ciphertext);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied to clipboard", description: `${text.length} characters` });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="bg-card/60 backdrop-blur border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileOutput className="w-5 h-5 text-accent" />
          Ciphertext Output
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <StateMatrix state={finalState} label="Final State" />
          <div className="text-center">
            <div className="text-xs font-mono text-muted-foreground mb-1">read column-by-column →</div>
            <div className="text-3xl">📤</div>
          </div>
          <StateMatrix state={bytesToState(ciphertext)} label="Output Bytes" />
        </div>

        <Tabs defaultValue="hex">
          <TabsList className="grid grid-cols-2 w-full md:w-64">
            <TabsTrigger value="hex">Hex</TabsTrigger>
            <TabsTrigger value="b64">Base64</TabsTrigger>
          </TabsList>
          <TabsContent value="hex" className="mt-3">
            <div className="relative">
              <div className="font-mono text-sm p-4 rounded-lg bg-secondary/60 border border-border break-all text-accent">
                {hex}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(hex.replace(/ /g, ""))}
                className="absolute top-2 right-2"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="b64" className="mt-3">
            <div className="relative">
              <div className="font-mono text-sm p-4 rounded-lg bg-secondary/60 border border-border break-all text-accent">
                {b64}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(b64)}
                className="absolute top-2 right-2"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
