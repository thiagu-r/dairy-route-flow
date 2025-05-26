import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Edit, Trash2 } from 'lucide-react';

interface Distributor {
  id: number;
  name: string;
  code: string;
  contact_person: string;
  mobile: string;
  address: string;
  is_internal: boolean;
  is_active: boolean;
}

const initialForm = {
  name: '',
  code: '',
  contact_person: '',
  mobile: '',
  address: '',
  is_internal: false,
  is_active: true,
};

export default function Distributors() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create/Edit distributor dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ ...initialForm });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDistributor, setDeletingDistributor] = useState<Distributor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchDistributors = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/distributors/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch distributors');
      const data = await res.json();
      setDistributors(data.results || data);
    } catch (err) {
      setError('Could not load distributors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributors();
  }, []);

  const handleDialogOpen = () => {
    setForm({ ...initialForm });
    setFormError(null);
    setEditingDistributor(null);
    setOpenDialog(true);
  };

  const handleEdit = (distributor: Distributor) => {
    setForm({ ...distributor });
    setFormError(null);
    setEditingDistributor(distributor);
    setOpenDialog(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let fieldValue: string | boolean = value;
    if (type === 'checkbox') {
      fieldValue = (e.target as HTMLInputElement).checked;
    }
    setForm(f => ({
      ...f,
      [name]: fieldValue,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const token = localStorage.getItem('access_token');
      let res;
      if (editingDistributor) {
        // Edit
        res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/distributors/${editingDistributor.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        });
      } else {
        // Create
        res = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/distributors/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        });
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to save distributor');
      }
      setOpenDialog(false);
      setForm({ ...initialForm });
      setEditingDistributor(null);
      fetchDistributors();
    } catch (err: unknown) {
      let message = 'Could not save distributor.';
      if (err instanceof Error) message = err.message;
      setFormError(message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (distributor: Distributor) => {
    setDeletingDistributor(distributor);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingDistributor) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/distributors/${deletingDistributor.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete distributor');
      setDeleteDialogOpen(false);
      setDeletingDistributor(null);
      fetchDistributors();
    } catch (err: unknown) {
      let message = 'Could not delete distributor.';
      if (err instanceof Error) message = err.message;
      setDeleteError(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <MainLayout requiredRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mb-1">Distributors</h1>
          <Button className="bg-blue-700 hover:bg-blue-800" onClick={handleDialogOpen}>
            Create Distributor
          </Button>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Is Internal</TableHead>
                    <TableHead>Is Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-red-500">{error}</TableCell>
                    </TableRow>
                  ) : distributors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">No distributors found.</TableCell>
                    </TableRow>
                  ) : (
                    distributors.map(d => (
                      <TableRow key={d.id}>
                        <TableCell>{d.name}</TableCell>
                        <TableCell>{d.code}</TableCell>
                        <TableCell>{d.contact_person}</TableCell>
                        <TableCell>{d.mobile}</TableCell>
                        <TableCell>{d.address}</TableCell>
                        <TableCell>{d.is_internal ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{d.is_active ? 'Yes' : 'No'}</TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-2">
                            <Button size="icon" variant="outline" aria-label="Edit" title="Edit" onClick={() => handleEdit(d)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="outline" aria-label="Delete" title="Delete" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(d)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Distributor Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingDistributor ? 'Edit Distributor' : 'Create Distributor'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  name="code"
                  value={form.code}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Person</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  name="contact_person"
                  value={form.contact_person}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_internal"
                    checked={form.is_internal}
                    onChange={handleFormChange}
                  />
                  Is Internal
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleFormChange}
                  />
                  Is Active
                </label>
              </div>
              {formError && <div className="text-red-500 text-sm">{formError}</div>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)} disabled={formLoading}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-700 hover:bg-blue-800" disabled={formLoading}>
                  {formLoading ? (editingDistributor ? 'Saving...' : 'Creating...') : (editingDistributor ? 'Save' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Distributor</DialogTitle>
            </DialogHeader>
            <div className="py-4">Are you sure you want to delete <b>{deletingDistributor?.name}</b>?</div>
            {deleteError && <div className="text-red-500 text-sm mb-2">{deleteError}</div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
} 