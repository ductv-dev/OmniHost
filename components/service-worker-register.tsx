"use client"

import { useEffect } from "react"

function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((registration) => {
        void registration.update()
      }).catch((error) => {
        console.error("Service worker registration failed:", error)
      })
    }

    if (document.readyState === "complete") register()
    else window.addEventListener("load", register, { once: true })

    return () => window.removeEventListener("load", register)
  }, [])

  return null
}

export { ServiceWorkerRegister }
