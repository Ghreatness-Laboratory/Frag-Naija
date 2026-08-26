import type { ComponentProps } from 'react';

type Provider = 'google' | 'discord' | 'facebook';

type SocialProvider = {
  label: string;
  provider: Provider;
  className: string;
  icon: React.ReactNode;
};

const disabledSocialAuthClassName = 'cursor-not-allowed pointer-events-none opacity-50';

function GoogleIcon(props: ComponentProps<'svg'>) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;
}

function DiscordIcon(props: ComponentProps<'svg'>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}><path d="M20.32 4.37A19.8 19.8 0 0 0 15.4 2.9a13.8 13.8 0 0 0-.63 1.3 18.3 18.3 0 0 0-5.54 0 12.6 12.6 0 0 0-.64-1.3 19.7 19.7 0 0 0-4.93 1.48C.55 9.06-.29 13.63.13 18.14a19.8 19.8 0 0 0 6.04 3.03c.49-.67.92-1.38 1.28-2.13a12.9 12.9 0 0 1-2.02-.97c.17-.12.33-.25.49-.38 3.9 1.84 8.13 1.84 11.98 0 .16.13.32.26.49.38-.64.38-1.32.71-2.02.97.36.75.78 1.46 1.28 2.13a19.7 19.7 0 0 0 6.04-3.03c.49-5.23-.84-9.76-3.37-13.77ZM8.02 15.4c-1.17 0-2.13-1.08-2.13-2.4s.94-2.4 2.13-2.4c1.2 0 2.15 1.08 2.13 2.4 0 1.32-.94 2.4-2.13 2.4Zm7.96 0c-1.17 0-2.13-1.08-2.13-2.4s.94-2.4 2.13-2.4c1.2 0 2.15 1.08 2.13 2.4 0 1.32-.94 2.4-2.13 2.4Z"/></svg>;
}

function FacebookIcon(props: ComponentProps<'svg'>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.03 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.03 1.79-4.7 4.54-4.7 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.5 0-1.97.94-1.97 1.9v2.27h3.35l-.54 3.49h-2.81V24C19.61 23.1 24 18.1 24 12.07Z"/></svg>;
}

const providers: SocialProvider[] = [
  { provider: 'google', label: 'Continue with Google', className: 'border border-fn-gborder text-fn-text hover:border-fn-green/50 hover:bg-fn-green/5', icon: <GoogleIcon className="h-4 w-4" /> },
  { provider: 'discord', label: 'Continue with Discord', className: 'bg-[#5865F2] text-white hover:bg-[#4752C4]', icon: <DiscordIcon className="h-4 w-4" /> },
  { provider: 'facebook', label: 'Continue with Facebook', className: 'bg-[#1877F2] text-white hover:bg-[#166FE5]', icon: <FacebookIcon className="h-4 w-4" /> },
];

export default function SocialAuthButtons() {
  return (
    <div className="space-y-2.5">
      {providers.map(({ provider, label, className, icon }) => (
        <button
          key={provider}
          type="button"
          disabled
          aria-disabled="true"
          data-auth-provider={provider}
          className={`flex w-full items-center justify-center gap-3 rounded py-2.5 text-sm font-bold transition-all ${className} ${disabledSocialAuthClassName}`}
        >
          {icon}
          {label}
        </button>
      ))}
      <p className="rounded border border-fn-yellow/30 bg-fn-yellow/10 px-3 py-2 text-[11px] font-semibold text-fn-yellow">
        Sign in with Google is currently disabled. Please use the sign-up form.
      </p>
    </div>
  );
}
