import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import { EnvErrorScreen } from '@/components/common/env-error-screen'
import { checkEnv } from '@/config/env'
import '@/index.css'

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Unable to mount: #root element is missing from index.html')
}

const envCheck = checkEnv()

createRoot(rootElement).render(
  <StrictMode>{envCheck.ok ? <App /> : <EnvErrorScreen missing={envCheck.missing} />}</StrictMode>,
)
