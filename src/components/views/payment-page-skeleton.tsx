
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function PaymentPageSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <div className="w-full max-w-2xl">
                 <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/20">
                    <CardHeader className="text-center">
                        <div className="flex items-center justify-center h-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-96 space-y-4">
                           <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
                           <p className="text-muted-foreground">Loading payment details...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
