import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/org/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/org/dashboard"!</div>
}
