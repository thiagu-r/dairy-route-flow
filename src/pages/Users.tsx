import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Edit2 } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  mobile_number?: string;
}

interface RoleOption {
  value: string;
  label: string;
}

interface CreateUserForm {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  password: string;
  mobile_number: string;
}

interface EditUserForm {
  first_name: string;
  last_name: string;
  role: string;
  password: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editShowPassword, setEditShowPassword] = useState(false);

  const form = useForm<CreateUserForm>({
    defaultValues: {
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      role: '',
      password: '',
      mobile_number: '',
    },
  });

  const editForm = useForm<EditUserForm>({
    defaultValues: {
      first_name: '',
      last_name: '',
      role: '',
      password: '',
    },
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You are not authenticated. Please login again.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.results);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [toast]);

  // Fetch roles when dialog opens
  const handleDialogOpen = async (open: boolean) => {
    setOpenDialog(open);
    if (open && roles.length === 0) {
      setRolesLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const res = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/users/roles/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch roles');
        const data = await res.json();
        setRoles(data);
      } catch (e) {
        toast({ title: 'Failed to fetch roles', variant: 'destructive' });
      } finally {
        setRolesLoading(false);
      }
    }
    if (!open) {
      form.reset();
      setShowPassword(false);
    }
  };

  // Fetch roles for edit dialog
  const handleEditDialogOpen = async (open: boolean, user?: User) => {
    setEditDialogOpen(open);
    if (open && roles.length === 0) {
      setRolesLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const res = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/users/roles/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch roles');
        const data = await res.json();
        setRoles(data);
      } catch (e) {
        toast({ title: 'Failed to fetch roles', variant: 'destructive' });
      } finally {
        setRolesLoading(false);
      }
    }
    if (open && user) {
      setEditUser(user);
      editForm.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        password: '',
      });
      setEditShowPassword(false);
    }
    if (!open) {
      setEditUser(null);
      editForm.reset();
      setEditShowPassword(false);
    }
  };

  // Create user handler
  const handleFormSubmit = async (values: CreateUserForm) => {
    setFormSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast({ title: 'Authentication Error', description: 'You are not authenticated. Please login again.', variant: 'destructive' });
        setFormSubmitting(false);
        return;
      }
      const response = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/users/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('Failed to create user');
      toast({ title: 'Success', description: 'User created successfully.' });
      setOpenDialog(false);
      form.reset();
      setShowPassword(false);
      fetchUsers();
    } catch (error) {
      toast({ title: 'Failed', description: 'Could not create user.', variant: 'destructive' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Edit user handler
  const handleEditFormSubmit = async (values: EditUserForm) => {
    if (!editUser) return;
    setFormSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast({ title: 'Authentication Error', description: 'You are not authenticated. Please login again.', variant: 'destructive' });
        setFormSubmitting(false);
        return;
      }
      // Only send password if provided
      const payload: Record<string, unknown> = {
        first_name: values.first_name,
        last_name: values.last_name,
        role: values.role,
      };
      if (values.password) payload.password = values.password;
      const response = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/users/${editUser.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update user');
      toast({ title: 'Success', description: 'User updated successfully.' });
      setEditDialogOpen(false);
      setEditUser(null);
      editForm.reset();
      setEditShowPassword(false);
      fetchUsers();
    } catch (error) {
      toast({ title: 'Failed', description: 'Could not update user.', variant: 'destructive' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter users by search term
  const filteredUsers = users.filter(user => {
    const searchString = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchString) ||
      user.email.toLowerCase().includes(searchString) ||
      user.first_name.toLowerCase().includes(searchString) ||
      user.last_name.toLowerCase().includes(searchString) ||
      user.role.toLowerCase().includes(searchString) ||
      (user.mobile_number || '').toLowerCase().includes(searchString)
    );
  });

  return (
    <MainLayout requiredRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Users</h1>
            <p className="text-gray-500">Manage system users and their roles</p>
          </div>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Search users..."
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Dialog open={openDialog} onOpenChange={handleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-700 hover:bg-blue-800">Create User</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[475px]">
                <DialogHeader>
                  <DialogTitle>Create User</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                    <FormField name="username" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl><Input {...field} required /></FormControl>
                      </FormItem>
                    )} />
                    <div className="flex gap-2">
                      <FormField name="first_name" control={form.control} render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>First Name</FormLabel>
                          <FormControl><Input {...field} required /></FormControl>
                        </FormItem>
                      )} />
                      <FormField name="last_name" control={form.control} render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Last Name</FormLabel>
                          <FormControl><Input {...field} required /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <FormField name="email" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" {...field} required /></FormControl>
                      </FormItem>
                    )} />
                    <FormField name="mobile_number" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl><Input type="tel" {...field} required maxLength={15} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField name="role" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange} disabled={rolesLoading} required>
                            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                            <SelectContent>
                              {roles.map(role => (
                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField name="password" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showPassword ? 'text' : 'password'} {...field} required />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                              tabIndex={-1}
                              onClick={() => setShowPassword((v) => !v)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
                      <Button type="submit" className="bg-blue-700 hover:bg-blue-800" disabled={formSubmitting}>{formSubmitting ? 'Creating...' : 'Create'}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-6">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.mobile_number || '-'}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="outline"
                            className="mr-2"
                            onClick={() => handleEditDialogOpen(true, user)}
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => handleEditDialogOpen(open)}>
          <DialogContent className="sm:max-w-[475px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditFormSubmit)} className="space-y-4">
                <FormField name="first_name" control={editForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} required /></FormControl>
                  </FormItem>
                )} />
                <FormField name="last_name" control={editForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} required /></FormControl>
                  </FormItem>
                )} />
                <FormField name="role" control={editForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange} disabled={rolesLoading} required>
                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )} />
                <FormField name="password" control={editForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={editShowPassword ? 'text' : 'password'} {...field} placeholder="Leave blank to keep current password" />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                          tabIndex={-1}
                          onClick={() => setEditShowPassword((v) => !v)}
                          aria-label={editShowPassword ? 'Hide password' : 'Show password'}
                        >
                          {editShowPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </FormControl>
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-700 hover:bg-blue-800" disabled={formSubmitting}>{formSubmitting ? 'Saving...' : 'Save'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
} 