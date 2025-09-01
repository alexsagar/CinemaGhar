import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  User, 
  Heart, 
  Clock, 
  Settings, 
  LogOut,
  Edit,
  Star,
  Play,
  Calendar,
  Eye
} from 'lucide-react';
import { cn } from '../lib/utils';

const Profile = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('tab') || 'profile';
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'watchlist', label: 'Watchlist', icon: Heart },
    { id: 'history', label: 'History', icon: Clock },
  ];

  // Mock data - replace with actual API calls
  const watchlist = [
    {
      _id: '1',
      title: 'The Matrix',
      posterURL: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
      year: 1999,
      contentType: 'movie',
      voteAverage: 8.7
    },
    {
      _id: '2',
      title: 'Breaking Bad',
      posterURL: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      year: 2008,
      contentType: 'series',
      voteAverage: 9.5
    }
  ];

  const history = [
    {
      _id: '1',
      title: 'Inception',
      posterURL: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
      year: 2010,
      contentType: 'movie',
      voteAverage: 8.8,
      watchedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    }
  ];

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Please Log In</h1>
          <p className="text-muted-foreground">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile - StreamFlix</title>
        <meta name="description" content="Manage your StreamFlix profile, watchlist, and viewing history." />
      </Helmet>

      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-card border border-border rounded-xl mb-8">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors border-b-2",
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-card border border-border rounded-xl p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full mt-2">
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Account Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">Name</label>
                        <p className="text-foreground">{user.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-foreground">{user.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">Role</label>
                        <p className="text-foreground capitalize">{user.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
                    <div className="space-y-3">
                      <button className="flex items-center space-x-3 w-full p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                        <Edit className="h-4 w-4" />
                        <span>Edit Profile</span>
                      </button>
                      <button className="flex items-center space-x-3 w-full p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                        <Settings className="h-4 w-4" />
                        <span>Account Settings</span>
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full p-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'watchlist' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">My Watchlist</h2>
                  <span className="text-muted-foreground">{watchlist.length} items</span>
                </div>

                {watchlist.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Your watchlist is empty</h3>
                    <p className="text-muted-foreground">Start adding movies and shows to your watchlist!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {watchlist.map((item) => (
                      <div key={item._id} className="bg-muted rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-[2/3] bg-muted relative">
                          {item.posterURL ? (
                            <img
                              src={item.posterURL}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Play className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{item.year}</span>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              <span>{item.voteAverage}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Viewing History</h2>
                  <span className="text-muted-foreground">{history.length} items</span>
                </div>

                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No viewing history</h3>
                    <p className="text-muted-foreground">Start watching to build your history!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div key={item._id} className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                        <div className="w-16 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                          {item.posterURL ? (
                            <img
                              src={item.posterURL}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Play className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <span>{item.year}</span>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              <span>{item.voteAverage}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{item.watchedAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <button className="flex items-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                          <Eye className="h-4 w-4" />
                          <span>Watch Again</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
