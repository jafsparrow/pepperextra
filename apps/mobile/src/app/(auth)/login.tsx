import { useState } from "react"

import { useLogin } from "@/feature/auth/hooks/use-login"
import { AuthButton } from "@/feature/auth/ui/components/auth-button"
import { AuthError } from "@/feature/auth/ui/components/auth-error"
import { AuthScreen } from "@/feature/auth/ui/components/auth-screen"
import { AuthTextField } from "@/feature/auth/ui/components/auth-text-field"

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login, isPending: isSubmitting, error } = useLogin()

  const submit = () => {
    void login({ email: email.trim(), password })
  }

  return (
    <AuthScreen title="Sign in" subtitle="Enter your account credentials.">
      <AuthTextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@company.com"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="next"
      />
      <AuthTextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
        textContentType="password"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <AuthError message={error} />
      <AuthButton title="Sign in" isPending={isSubmitting} onPress={submit} />
    </AuthScreen>
  )
}
