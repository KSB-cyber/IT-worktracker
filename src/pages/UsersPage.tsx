import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Mail, Calendar, Shield, User, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function UsersPage() {
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // First get all profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      setLoading(false);
      return;
    }

    // Then get roles for each user
    const userIds = profiles?.map(p => p.user_id) || [];
    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .in('user_id', userIds);

    // Combine profiles with their roles
    const usersWithRoles = profiles?.map(profile => ({
      ...profile,
      user_roles: roles?.filter(r => r.user_id === profile.user_id) || []
    })) || [];

    setUsers(usersWithRoles);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse-soft text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-primary bg-clip-text text-transparent animate-gradient title-glow tracking-tight">Users</h1>
          <p className="text-lg text-muted-foreground mt-3 font-medium">Manage system users and their roles</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-black text-primary">{users.length}</p>
              <p className="text-sm text-muted-foreground font-medium">Total Users</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-xl min-h-[600px]">
        <CardContent className="p-6">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Users className="w-24 h-24 text-muted-foreground/30 mb-6" />
              <h3 className="text-2xl font-bold text-foreground mb-2">No Users Found</h3>
              <p className="text-lg text-muted-foreground">There are currently no users in the system</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(user => {
              const role = (user.user_roles as any)?.[0]?.role || 'user';
              return (
                <div key={user.id} className="p-5 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-blue-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-foreground">{user.full_name || 'No Name'}</h3>
                        <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                          {role === 'admin' ? (
                            <><Shield className="w-3 h-3 mr-1" /> Admin</>
                          ) : (
                            <><User className="w-3 h-3 mr-1" /> User</>
                          )}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-base text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </span>
                        {user.department && (
                          <span className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {user.department}
                          </span>
                        )}
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Joined {format(parseISO(user.created_at as string), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
