import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { signIn } from "@pepperextra/auth/client"
import { LoginForm } from "@/feature/auth/ui/components/login-form"
import { useMutation } from "@tanstack/react-query"

export const Route = createFileRoute("/_auth/login")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      await signIn.email({
        email: data.email,
        password: data.password,
      })
    },
    onSuccess: (data) => {
      console.log("sucees login")

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
