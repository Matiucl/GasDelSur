import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/context/AuthContext'

interface TopBarProps {
  title?: string
  showBack?: boolean
  showLogo?: boolean
}

export function TopBar({ title, showBack = false, showLogo = true }: TopBarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <header className="flex justify-between items-center w-full px-4 md:px-8 py-2 bg-surface border-b border-outline-variant sticky top-0 z-40 h-16">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="text-primary p-1 rounded-full hover:bg-surface-container transition-colors"
          >
            <Icon name="arrow_back" />
          </button>
        )}
        {showLogo && (
          <div className="flex items-center gap-2">
            <Icon name="mode_fan" filled className="text-primary text-3xl" />
            <span className="font-black text-xl text-primary tracking-tight">
              Gas del Sur
            </span>
          </div>
        )}
        {title && !showLogo && (
          <h1 className="text-lg font-semibold text-on-surface">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="text-on-surface-variant hover:bg-surface-container transition-colors p-2 rounded-full">
          <Icon name="notifications" />
        </button>
        <button className="text-on-surface-variant hover:bg-surface-container transition-colors p-2 rounded-full">
          <Icon name="help" />
        </button>
        {user && (
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center border-2 border-primary-fixed ml-1">
            <span className="text-on-primary-container font-bold text-sm">
              {user.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
