import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { signIn } from "@repo/auth/client"
import { LoginForm } from "@/feature/auth/ui/components/login-form"
import { useMutation } from "@tanstack/react-query"

export const Route = createFileRoute("/_auth/login")({
  validateSearch: (
    search: Record<string, unknown>
  ): { redirect?: string } => ({
    redirect:
      typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { redirect: redirectTo } = Route.useSearch()
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      await signIn.email({
        email: data.email,
        password: data.password,
      })
    },
    onSuccess: () => {
      console.log("sucees login")

      if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
        window.location.href = redirectTo
        return
      }

      navigate({ to: "/admin/users" })
    },
    onError: (error) => console.log(error),
  })
  return (
    <LoginForm
      onSubmit={({ email, password }) =>
        loginMutation.mutate({ email, password })
      }
    />
  )
}
