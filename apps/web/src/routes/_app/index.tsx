import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Cloud, Server, ShieldCheck, MailCheck, KeyRound, Sparkles, ArrowRight } from "lucide-react"

import { useDeploymentMode } from "@/shared/utils/deployment-mode"

export const Route = createFileRoute("/_app/")({ component: App })

function App() {
  const { mode, isLocal } = useDeploymentMode()

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold animate-pulse">
          <Sparkles className="h-3 w-3" />
          PepperExtra platform ready
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          POS & Restaurant Management
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Unified software for cloud multi-tenant restaurant brands and offline-tolerant local branch POS installations.
        </p>
      </div>

      <div>{mode} mode is this {isLocal.toString()}</div>

      <div className="grid gap-6 md:grid-cols-2 w-full">
        {/* Environment Status Card */}
        <Card className="shadow-lg border-2 border-primary/20 backdrop-blur-sm bg-card/80 transition-all duration-300 hover:shadow-xl flex flex-col justify-between">
          <div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  {isLocal ? (
                    <Server className="h-5 w-5 text-primary" />
                  ) : (
                    <Cloud className="h-5 w-5 text-primary" />
                  )}
                  System Environment
                </CardTitle>
                <Badge
                  variant={isLocal ? "secondary" : "default"}
                  className={`font-semibold capitalize text-xs px-2.5 py-0.5 border ${
                    isLocal
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  }`}
                >
                  {isLocal ? "Local Installation" : "Cloud SaaS Mode"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Automatically determined via environment file configurations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/40 text-xs leading-relaxed text-muted-foreground border border-border/40">
                {isLocal ? (
                  <p>
                    <strong>On-Premise Mode active.</strong> Since this is a local installation (offline-tolerant client machine), password resets and email verifications are auto-confirmed. No external email service is required.
                  </p>
                ) : (
                  <p>
                    <strong>Cloud SaaS Mode active.</strong> Multi-tenant billing, automated email confirmation links, OTP codes, and offsite backups are fully enabled.
                  </p>
                )}
              </div>

              {/* Behavior parameters checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Operational Parameters:
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MailCheck className={`h-4 w-4 shrink-0 ${isLocal ? "text-emerald-500" : "text-blue-500"}`} />
                    <span>
                      Email Verification: <strong>{isLocal ? "Auto-Confirmed (Bypassed)" : "Required (OTP / Link)"}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <KeyRound className={`h-4 w-4 shrink-0 ${isLocal ? "text-emerald-500" : "text-blue-500"}`} />
                    <span>
                      Password Reset Confirmation: <strong>{isLocal ? "Instant (No Confirmation Needed)" : "Required"}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className={`h-4 w-4 shrink-0 ${isLocal ? "text-emerald-500" : "text-blue-500"}`} />
                    <span>
                      Licensing Validation: <strong>{isLocal ? "Active (Host fingerprint verified)" : "SaaS Subscription Active"}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Quick Navigation Card */}
        <Card className="shadow-md border border-border/40 backdrop-blur-sm bg-card/80 flex flex-col justify-between">
          <div className="p-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              Quick Management
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Start managing restaurant structures, staff directory, and branch locations.
            </p>
            <div className="space-y-3 mt-6">
              <Button asChild className="w-full justify-between font-semibold shadow-sm text-sm group" size="lg">
                <Link to="/org">
                  <span>Go to Restaurant Brand Dashboard</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between font-semibold text-sm" size="lg">
                <Link to="/org/teams">
                  <span>Manage Branches & Invites</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="p-6 border-t border-border/40 bg-muted/10 text-[10px] text-muted-foreground text-center">
            Deployments utilize unified schemas ensuring clean database migration path.
          </div>
        </Card>
      </div>
    </div>
  )
}
