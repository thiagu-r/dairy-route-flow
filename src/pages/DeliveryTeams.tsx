import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Edit, Trash2 } from 'lucide-react';

interface DeliveryTeam {
  id: number;
  name: string;
  distributor: number;
  distributor_name: string;
  route: number;
  route_name: string;
}

interface Distributor {
  id: number;
  name: string;
}

interface Route {
  id: number;
  name: string;
}

const initialForm = {
  name: '',
  distributor: '',
  route: '',
};

export default function DeliveryTeams() {
  const [teams, setTeams] = useState<DeliveryTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create/Edit dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ ...initialForm });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState<DeliveryTeam | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<DeliveryTeam | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/delivery-teams/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch delivery teams');
      const data = await res.json();
      setTeams(data.results || data);
    } catch (err) {
      setError('Could not load delivery teams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchDropdowns = async () => {
    setDropdownsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const [distRes, routeRes] = await Promise.all([
        fetch('https://bharatdairy.pythonanywhere.com/apiapp/distributors/', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('https://bharatdairy.pythonanywhere.com/apiapp/routes/', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      if (!distRes.ok) throw new Error('Failed to fetch distributors');
      if (!routeRes.ok) throw new Error('Failed to fetch routes');
      const distData = await distRes.json();
      const routeData = await routeRes.json();
      setDistributors(distData.results || distData);
      setRoutes(routeData.results || routeData);
    } finally {
      setDropdownsLoading(false);
    }
  };

  const handleDialogOpen = () => {
    setForm({ ...initialForm });
    setFormError(null);
    setEditingTeam(null);
    fetchDropdowns();
    setOpenDialog(true);
  };

  const handleEdit = (team: DeliveryTeam) => {
    setForm({
      name: team.name,
      distributor: String(team.distributor),
      route: String(team.route),
    });
    setFormError(null);
    setEditingTeam(team);
    fetchDropdowns();
    setOpenDialog(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        name: form.name,
        distributor: Number(form.distributor),
        route: Number(form.route),
      };
      let res;
      if (editingTeam) {
        // Edit
        res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/delivery-teams/${editingTeam.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        res = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/delivery-teams/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to save delivery team');
      }
      setOpenDialog(false);
      setForm({ ...initialForm });
      setEditingTeam(null);
      fetchTeams();
    } catch (err: unknown) {
      let message = 'Could not save delivery team.';
      if (err instanceof Error) message = err.message;
      setFormError(message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (team: DeliveryTeam) => {
    setDeletingTeam(team);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTeam) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/delivery-teams/${deletingTeam.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete delivery team');
      setDeleteDialogOpen(false);
      setDeletingTeam(null);
      fetchTeams();
    } catch (err: unknown) {
      let message = 'Could not delete delivery team.';
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
          <h1 className="text-2xl font-bold mb-1">Delivery Team</h1>
          <Button className="bg-blue-700 hover:bg-blue-800" onClick={handleDialogOpen}>
            Create Delivery Team
          </Button>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Distributor</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-red-500">{error}</TableCell>
                    </TableRow>
                  ) : teams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">No delivery teams found.</TableCell>
                    </TableRow>
                  ) : (
                    teams.map(team => (
                      <TableRow key={team.id}>
                        <TableCell>{team.name}</TableCell>
                        <TableCell>{team.distributor_name}</TableCell>
                        <TableCell>{team.route_name}</TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-2">
                            <Button size="icon" variant="outline" aria-label="Edit" title="Edit" onClick={() => handleEdit(team)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="outline" aria-label="Delete" title="Delete" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(team)}>
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

        {/* Create/Edit Delivery Team Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTeam ? 'Edit Delivery Team' : 'Create Delivery Team'}</DialogTitle>
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
                <label className="block text-sm font-medium mb-1">Distributor</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  name="distributor"
                  value={form.distributor}
                  onChange={handleFormChange}
                  required
                  disabled={dropdownsLoading}
                >
                  <option value="">Select Distributor</option>
                  {distributors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Route</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  name="route"
                  value={form.route}
                  onChange={handleFormChange}
                  required
                  disabled={dropdownsLoading}
                >
                  <option value="">Select Route</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              {formError && <div className="text-red-500 text-sm">{formError}</div>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)} disabled={formLoading}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-700 hover:bg-blue-800" disabled={formLoading}>
                  {formLoading ? (editingTeam ? 'Saving...' : 'Creating...') : (editingTeam ? 'Save' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Delivery Team</DialogTitle>
            </DialogHeader>
            <div className="py-4">Are you sure you want to delete <b>{deletingTeam?.name}</b>?</div>
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