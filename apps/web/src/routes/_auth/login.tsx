import { createFileRoute } from "@tanstack/react-router"
import { signIn } from "@pepperextra/auth/client"
import { LoginForm } from "@/feature/auth/ui/components/login-form"
import { useMutation } from "@tanstack/react-query"

export const Route = createFileRoute("/_auth/login")({
  component: RouteComponent,
})

function RouteComponent() {
  const handleLogin = async () => {
    const { data, error } = await signIn.email({
      email: "user@example.com",
      password: "password",
    })
  }

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      await signIn.email({
        email: data.email,
        password: data.password,
      })
    },
    onSuccess: (data) => console.log("sucees login"),
    onError: (error) => console.log(error),
  })
  return <LoginForm onSubmit={({ email, password }) => handleLogin()} />
}
