import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-center"
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-neutral-900 group-[.toaster]:text-white group-[.toaster]:border-neutral-800 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-neutral-400",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-neutral-700 group-[.toast]:text-neutral-300",
          success:
            "group-[.toast]:bg-green-900/50 group-[.toast]:text-green-400 group-[.toast]:border-green-800",
          error:
            "group-[.toast]:bg-red-900/50 group-[.toast]:text-red-400 group-[.toast]:border-red-800",
          info:
            "group-[.toast]:bg-blue-900/50 group-[.toast]:text-blue-400 group-[.toast]:border-blue-800",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
