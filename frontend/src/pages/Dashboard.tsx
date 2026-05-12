import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Github, FileText, Eye, TrendingUp, Clock, CheckCircle, ArrowRight, Upload, Award, Brain, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import AIAssistant from '@/components/AIAssistant';
import ResumeUploadDialog from '@/components/ResumeUploadDialog';
import { useAuthContext } from '@/contexts/AuthContext';

const Dashboard = () => {
  const [uploadStatus, setUploadStatus] = useState(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const { user, loading } = useAuthContext();
  const [isProfileInfoComplete, setIsProfileInfoComplete] = useState(false);
  const [isProjectsAdded, setIsProjectsAdded] = useState(false);
  const [isSkillsAdded, setIsSkillsAdded] = useState(false);
  const [isAchievementsAdded, setIsAchievementsAdded] = useState(false);
  const completionProgress = [isProfileInfoComplete, isProjectsAdded, isSkillsAdded, isAchievementsAdded,].filter(Boolean).length * 25;

  const stats = [
    {
      label: 'Total Projects',
      value: '0',
      icon: Github,
      color: 'text-electric',
      bgColor: 'bg-electric/10'
    },
    {
      label: 'Total Skills',
      value: '0',
      icon: Brain,
      color: 'text-pulse',
      bgColor: 'bg-pulse/10'
    },
    {
      label: 'Total Achievements',
      value: '0',
      icon: Award,
      color: 'text-success',
      bgColor: 'bg-success/10'
    }
  ];

  const actionCards = [
    {
      title: 'Add Project',
      description: 'Import from GitHub or add manually',
      icon: Plus,
      color: 'electric',
      link: '/projects'
    },
    {
      title: 'Add Skills',
      description: 'Manage your technical skills',
      icon: Brain,
      color: 'primary',
      link: '/skills'
    },
    {
      title: 'Add Achievement',
      description: 'Add awards, internships & milestones',
      icon: Award,
      color: 'warning',
      link: '/achievements'
    },
    {
      title: 'View Portfolio',
      description: 'See how your portfolio looks',
      icon: Eye,
      color: 'success',
      link: '/main-portfolio'
    }
  ];

  const recentActivity = [
    {
      action: 'Welcome aboard! Your Portfolia account was created.',
      time: 'Now',
      icon: CheckCircle,
      status: 'completed'
    },
    // {
    //   action: 'Added "AWS Cloud Internship" achievement',
    //   time: '1 day ago',
    //   icon: CheckCircle,
    //   status: 'completed'
    // },
    // {
    //   action: 'Generated AI summary for "ML Project"',
    //   time: '2 days ago',
    //   icon: Github,
    //   status: 'completed'
    // },
    // {
    //   action: 'Updated portfolio theme to "Modern"',
    //   time: '3 days ago',
    //   icon: Eye,
    //   status: 'completed'
    // },
    // {
    //   action: 'Uploaded resume and extracted skills',
    //   time: '4 days ago',
    //   icon: FileText,
    //   status: 'completed'
    // },
    // {
    //   action: 'Added new certificate "React Fundamentals"',
    //   time: '5 days ago',
    //   icon: CheckCircle,
    //   status: 'completed'
    // },
    // {
    //   action: 'Updated project descriptions with AI',
    //   time: '1 week ago',
    //   icon: TrendingUp,
    //   status: 'completed'
    // },
    // {
    //   action: 'Shared portfolio with 5 recruiters',
    //   time: '1 week ago',
    //   icon: Eye,
    //   status: 'completed'
    // }
  ];

  const handleResumeUpload = () => {
    setUploadStatus('uploading');
    setTimeout(() => {
      setUploadStatus('success');
      setTimeout(() => setUploadStatus(null), 3000);
    }, 2000);
  };
  if (loading) return <p>Loading...</p>;
  return (
    <div className="min-h-screen pt-16 bg-gradient-soft">
      <div className="container mx-auto px-4 py-8">
        {/* Background with mesh effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-pink-50/30 dark:from-slate-900 dark:via-purple-900/10 dark:to-slate-900" />
          <div className="mesh-bg absolute inset-0" />
        </div>
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl lg:text-4xl font-space font-bold mb-2">
            Welcome back, <span className="text-3xl lg:text-4xl font-space font-bold text-gradient-primary mb-2">{(user?.full_name || 'User').split(' ')[0]}</span> 👋
          </h1>
          <p className="text-foreground-muted text-lg">
            Let's continue building your amazing portfolio
          </p>
        </div>

        {/* Resume Upload Section */}
        <Card className="glass-card mb-8 animate-slide-in-up">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-xl font-semibold mb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Resume Upload & Auto-Categorization
              </h2>
              <p className="text-foreground-muted text-sm">
                Upload your resume and we'll automatically extract achievements, skills, and experiences using AI to update all portfolio sections.
              </p>
            </div>
            <div className="flex space-x-3">
              <ResumeUploadDialog
                onUploadSuccess={() => {
                  // Show success status
                  setUploadStatus('success');
                  // Hide after 5 seconds
                  setTimeout(() => setUploadStatus(null), 5000);
                  // Optionally reload dashboard data here
                }}
              >
                <Button
                  className="btn-primary"
                  disabled={uploadStatus === 'uploading'}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadStatus === 'uploading' ? 'Processing...' : 'Upload Resume'}
                </Button>
              </ResumeUploadDialog>
            </div>
          </div>

          {uploadStatus && (
            <div className={`mt-4 p-4 rounded-lg border ${uploadStatus === 'success'
                ? 'bg-success/10 border-success/20 text-success'
                : 'bg-warning/10 border-warning/20 text-warning'
              }`}>
              <div className="flex items-center">
                {uploadStatus === 'success' ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                )}
                {uploadStatus === 'success'
                  ? 'Resume parsed successfully! Auto-categorized 3 achievements, 5 skills, and 2 projects across portfolio sections.'
                  : 'Analyzing your resume with AI and auto-categorizing content...'
                }
              </div>
            </div>
          )}
        </Card>

        {/* Profile Completion */}
        <Card className="glass-card mb-8 animate-slide-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Profile Completion</h2>
              <p className="text-foreground-muted text-sm">
                Complete your profile to increase visibility
              </p>
            </div>
            <div className="text-2xl font-bold text-gradient-primary">
              {completionProgress}%
            </div>
          </div>
          <div className="relative">
            <Progress
              value={completionProgress}
              className="h-3 bg-[#dbc8ebff] rounded-full"
              style={{
                backgroundImage: `linear-gradient(to right, #dbc8ebff, #6314a3ff)`,
                backgroundSize: `${completionProgress}% 100%`,
                backgroundRepeat: 'no-repeat',
              }}
            />

            <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 animate-pulse-slow" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4 text-xs">
            <div className={`flex items-center ${isProfileInfoComplete ? 'text-success' : 'text-gray-400'}`}>
              {isProfileInfoComplete ? <CheckCircle className="w-3 h-3 mr-1" /> : <MinusCircle className="w-3 h-3 mr-1" />}
              Profile Info
            </div>
            <div className={`flex items-center ${isProjectsAdded ? 'text-success' : 'text-gray-400'}`}>
              {isProjectsAdded ? <CheckCircle className="w-3 h-3 mr-1" /> : <MinusCircle className="w-3 h-3 mr-1" />}
              Project Added
            </div>
            <div className={`flex items-center ${isSkillsAdded ? 'text-success' : 'text-gray-400'}`}>
              {isSkillsAdded ? <CheckCircle className="w-3 h-3 mr-1" /> : <MinusCircle className="w-3 h-3 mr-1" />}
              Skills Added
            </div>
            <div className={`flex items-center ${isAchievementsAdded ? 'text-success' : 'text-gray-400'}`}>
              {isAchievementsAdded ? <CheckCircle className="w-3 h-3 mr-1" /> : <MinusCircle className="w-3 h-3 mr-1" />}
              Achievements Added
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="glass-card interactive animate-slide-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground-muted text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Action Cards */}
          <div className="space-y-6">
            <h2 className="text-2xl font-space font-bold text-gradient-primary">
              Quick Actions
            </h2>
            <div className="space-y-4">
              {actionCards.map((card, index) => (
                <Link key={index} to={card.link}>
                  <Card className="glass-card interactive group animate-slide-in-right" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center group-hover:glow-primary transition-all`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{card.title}</h3>
                        <p className="text-foreground-muted text-sm">{card.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-foreground-muted group-hover:text-primary transition-colors" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <h2 className="text-2xl font-space font-bold text-gradient-primary">
              Recent Activity
            </h2>
            <Card className="glass-card animate-slide-in-right">
              {showAllActivities ? (
                <ScrollArea className="h-80">
                  <div className="space-y-4 pr-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mt-1">
                          <activity.icon className="w-4 h-4 text-success" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-foreground-muted">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 4).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mt-1">
                        <activity.icon className="w-4 h-4 text-success" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-foreground-muted">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAllActivities(!showAllActivities)}
                >
                  {showAllActivities ? 'Show Less' : 'View All Activity'}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Portfolio Preview CTA */}
        <Card className="glass-card mt-8 animate-slide-in-up">
          <div className="text-center">
            <h2 className="text-2xl font-space font-bold mb-3">
              Ready to share your <span className="text-gradient-primary">portfolio</span>?
            </h2>
            <p className="text-foreground-muted mb-6">
              Your portfolio is looking great! Preview it and share with potential employers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/portfolio">
                <Button className="btn-primary">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Portfolio
                </Button>
              </Link>
              <Link to="/export">
                <Button variant="outline">
                  Export & Share
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <AIAssistant />
    </div>
  );
};

export default Dashboard;