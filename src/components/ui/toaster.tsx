import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={800} swipeDirection="up">
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props} 
            className="bg-[#080d17]/95 backdrop-blur-md border-gaming-primary/30 shadow-xl mb-2 mt-safe"
          >
            <div className="grid gap-0.5">
              {title && <ToastTitle className="text-gaming-primary font-bold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-white/80 text-xs">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-white/60 hover:text-white" />
          </Toast>
        )
      })}
      <ToastViewport className="" />
    </ToastProvider>
  )
}
