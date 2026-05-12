import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Check, X, Loader2, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import API from '@/api/axios';
import { API_URL } from '@/utils/api';

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const [searchParams] = useSearchParams();
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [signupForm, setSignupForm] = useState({
    fullname: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.id]: e.target.value });
    if (loginError) setLoginError('');
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    // Map input IDs to state keys
    const keyMap: Record<string, string> = {
      'signup-fullname': 'fullname',
      'signup-username': 'name',
      'signup-email': 'email',
      'signup-password': 'password',
      'signup-confirm': 'confirmPassword'
    };

    const key = keyMap[id] || id;
    setSignupForm({ ...signupForm, [key]: value });
    if (signupError) setSignupError('');
  };

  // OTP Verification State
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Password Complexity Verification
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    upper: false,
    number: false,
    symbol: false
  });

  useEffect(() => {
    const p = signupForm.password;
    setPasswordValidation({
      length: p.length >= 8,
      upper: /[A-Z]/.test(p),
      number: /[0-9]/.test(p),
      symbol: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(p)
    });
  }, [signupForm.password]);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token).then(() => {
        toast({
          title: "Logged in with Google",
          description: "Welcome back!",
        });
        navigate('/dashboard');
      });
    }
  }, [searchParams, navigate, toast, login]);

  useEffect(() => {
    // Fetch CSRF token on mount to ensure cookie is set
    const initCSRF = async () => {
      try {
        await API.get('/api/v1/auth/csrf');
      } catch (err) {
        console.error('Initial CSRF fetch failed:', err);
      }
    };
    initCSRF();

    const checkUsername = async () => {
      if (!signupForm.name || signupForm.name.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      try {
        const res = await API.get(`/api/v1/auth/check-username/${signupForm.name}`);
        setUsernameAvailable(res.data.available);
      } catch (err) {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [signupForm.name]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const res = await API.post('/api/v1/auth/login', {
        email: loginForm.email,
        password: loginForm.password,
      });

      await login(res.data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.verified === false) {
        toast({
          title: "Email not verified yet",
          description: "Please enter the verification code sent to your email.",
        });
        setVerifyingEmail(err.response.data.email);
        setOtpStep(true);
      } else {
        setLoginError(err.response?.data?.detail || "Something went wrong, Please try again");
      }
      console.error(err);
    } finally {
      if (!otpStep) setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    // Check frontend validation
    if (!Object.values(passwordValidation).every(v => v)) {
      setSignupError("Please satisfy all password requirements");
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/api/v1/auth/signup', {
        full_name: signupForm.fullname,
        username: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
      });

      toast({
        title: "Account created!",
        description: "Please check your email for the verification code.",
      });
      setVerifyingEmail(signupForm.email);
      setOtpStep(true);
    } catch (err: any) {
      setSignupError(err.response?.data?.detail || "Something went wrong during signup");
      console.error(err);
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setIsVerifying(true);
    try {
      const res = await API.post('/api/v1/auth/verify-otp', {
        email: verifyingEmail,
        otp_code: otpCode
      });
      await login(res.data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setOtpError(err.response?.data?.detail || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setResendStatus('Sending...');
    try {
      await API.post('/api/v1/auth/resend-otp', { email: verifyingEmail });
      setResendStatus('New code sent!');
      setTimeout(() => setResendStatus(''), 3000);
    } catch (err) {
      setResendStatus('Failed to send');
    }
  };

  if (otpStep) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-scale-in">
          <Card className="glass-card p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 text-primary">
                <Mail className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-space font-bold text-gradient-primary mb-2">
                Verify Your Email
              </h1>
              <p className="text-foreground-muted">
                Enter the 6-digit code sent to <span className="text-foreground font-medium">{verifyingEmail}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              {otpError && (
                <p className="text-sm text-red-500 text-center">{otpError}</p>
              )}

              <Button type="submit" className="btn-primary w-full" disabled={isVerifying || otpCode.length !== 6}>
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Verify Account
              </Button>

              <div className="text-center space-y-4">
                <p className="text-sm text-foreground-muted">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-primary hover:underline font-medium"
                  >
                    Resend Code
                  </button>
                </p>
                {resendStatus && <p className="text-xs text-primary font-medium">{resendStatus}</p>}

                <button
                  type="button"
                  onClick={() => setOtpStep(false)}
                  className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  Change Email / Back to Login
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  const ValidationItem = ({ label, isValid }: { label: string, isValid: boolean }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${isValid ? 'text-green-500' : 'text-foreground-muted'}`}>
      {isValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <Card className="glass-card">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <img src="/programming.png" alt="Icon" className="w-14 h-14 object-contain" />
            </div>
            <h1 className="text-2xl font-space font-bold text-gradient-primary mb-2">
              Welcome to PortFoliaaaaa
            </h1>
            <p className="text-foreground-muted">
              Build your professional identity with AI
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                {loginError && (
                  <p className="text-sm text-red-500 text-center">{loginError}</p>
                )}
                <Button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sign In
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>

                <div className="text-center">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot your password?
                  </Link>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <Input
                      id="signup-fullname"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      value={signupForm.fullname}
                      onChange={handleSignupChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-username" className="text-sm font-medium">
                    User Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="John"
                      className="pl-10 pr-10"
                      value={signupForm.name}
                      onChange={handleSignupChange}
                      required
                      disabled={loading}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {checkingUsername ? (
                        <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
                      ) : usernameAvailable === true ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : usernameAvailable === false ? (
                        <X className="w-4 h-4 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  {usernameAvailable === false && (
                    <p className="text-xs text-red-500 mt-1">Username is already taken</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      value={signupForm.email}
                      onChange={handleSignupChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={signupForm.password}
                      onChange={handleSignupChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  {/* Password Complexity Checklist */}
                  <div className="grid grid-cols-2 gap-1 px-1">
                    <ValidationItem label="8+ characters" isValid={passwordValidation.length} />
                    <ValidationItem label="1 Uppercase" isValid={passwordValidation.upper} />
                    <ValidationItem label="1 Number" isValid={passwordValidation.number} />
                    <ValidationItem label="1 Special Symbol" isValid={passwordValidation.symbol} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={signupForm.confirmPassword}
                      onChange={handleSignupChange}
                      required
                      disabled={loading}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {signupForm.confirmPassword && (
                        signupForm.password === signupForm.confirmPassword ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )
                      )}
                    </div>
                  </div>
                </div>
                {signupError && (
                  <p className="text-sm text-red-500 text-center">{signupError}</p>
                )}
                <Button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Account
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>

                <p className="text-xs text-foreground-muted text-center">
                  By signing up, you agree to our{' '}
                  <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-foreground-muted">
              Continue with social accounts
            </p>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" className="flex-1">
                GitHub
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={loading || isGoogleLoading}
                onClick={() => {
                  setIsGoogleLoading(true);
                  window.location.href = `${API_URL}/api/v1/auth/google/login`;
                }}
              >
                {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Chrome className="w-4 h-4 mr-2" />}
                Google
              </Button>
            </div>
          </div>
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;