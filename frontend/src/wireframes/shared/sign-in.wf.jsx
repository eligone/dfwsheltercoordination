// EXAMPLE wireframe. Copy this file's shape for your own.
// Shared screen (not counted in the 12). Covers NFR-14: sign in before the dashboard.
import { Banner, Button, Card, Input } from '../../components/ui';

export const meta = {
  uc: 'NFR-14',
  title: 'Sign In',
  owner: 'Shared',
  screen: 'Sign In',
  states: ['default', 'error'],
  width: 720,
};

export default function SignIn({ state }) {
  const error = state === 'error';
  return (
    <div className="flex min-h-[520px] items-center justify-center bg-canvas p-8">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">DFW Shelter Tracker</h1>
          <p className="text-sm text-muted">Shelter staff sign in</p>
        </div>
        {error && <Banner tone="alert" title="Incorrect email or password.">Try again or contact your shelter admin.</Banner>}
        <Card>
          <div className="space-y-4">
            <Input label="Staff email" placeholder="name@shelter.org" defaultValue={error ? 'jdoe@richardson.example' : ''} />
            <Input label="Password" type="password" placeholder="••••••••" error={error ? 'Password is incorrect' : undefined} />
            <Button className="w-full">Sign in</Button>
            <p className="text-center text-sm text-muted underline">Forgot password?</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
