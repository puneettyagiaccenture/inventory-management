import { ref, watchEffect } from 'vue'

const isDark = ref(localStorage.getItem('theme') === 'dark')

export function useDarkMode() {
  const toggle = () => {
    isDark.value = !isDark.value
  }

  watchEffect(() => {
    const root = document.documentElement
    if (isDark.value) {
      root.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
      localStorage.setItem('theme', 'light')
    }
  })

  return { isDark, toggle }
}
