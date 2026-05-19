'use client';

import { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getAdminBosses, type AdminBossRow } from '@/app/actions/admin/get-admin-bosses';
import { upsertAdminBoss } from '@/app/actions/admin/upsert-admin-boss';
import { deleteAdminBoss } from '@/app/actions/admin/delete-admin-boss';
import { getAdminAvatars, type AdminAvatarRow } from '@/app/actions/admin/get-admin-avatars';
import { upsertAdminAvatar } from '@/app/actions/admin/upsert-admin-avatar';
import { useToast } from '@/hooks/use-toast';
import Loader from '@/components/ui/loader';
import { Pencil, Plus, Trash2 } from 'lucide-react';

function normalizeBossAssetName(name: string) {
  return name.toLowerCase().replace(/\s+/g, '');
}

export function AdminContentPanel() {
  const [subTab, setSubTab] = useState<'bosses' | 'avatars'>('bosses');

  return (
    <Tabs value={subTab} onValueChange={(v) => setSubTab(v as 'bosses' | 'avatars')} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="bosses">Bosses</TabsTrigger>
        <TabsTrigger value="avatars">Avatars</TabsTrigger>
      </TabsList>
      <TabsContent value="bosses" className="mt-4">
        {subTab === 'bosses' ? <BossesAdmin /> : null}
      </TabsContent>
      <TabsContent value="avatars" className="mt-4">
        {subTab === 'avatars' ? <AvatarsAdmin /> : null}
      </TabsContent>
    </Tabs>
  );
}

function BossesAdmin() {
  const { toast } = useToast();
  const [bosses, setBosses] = useState<AdminBossRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBossRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { bosses: data, error } = await getAdminBosses();
    if (error) toast({ variant: 'destructive', title: 'Bosses', description: error });
    setBosses(data);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing({
      id: 0,
      name: '',
      level: 1,
      location: '',
      spawn_time: '',
      is_fixed_spawn: false,
      respawn_cooldown: null,
      created_at: new Date().toISOString(),
    });
    setDialogOpen(true);
  };

  const openEdit = (boss: AdminBossRow) => {
    setEditing({ ...boss });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const payload = {
      id: editing.id > 0 ? editing.id : undefined,
      name: editing.name,
      level: editing.level,
      location: editing.location,
      spawn_time: editing.spawn_time,
      is_fixed_spawn: editing.is_fixed_spawn,
      respawn_cooldown: editing.respawn_cooldown,
    };
    const result = await upsertAdminBoss(payload);
    setSaving(false);
    if (result.success) {
      toast({ title: 'Boss saved' });
      setDialogOpen(false);
      load();
    } else {
      toast({ variant: 'destructive', title: 'Save failed', description: result.error ?? undefined });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this boss?')) return;
    const result = await deleteAdminBoss(id);
    if (result.success) {
      toast({ title: 'Boss deleted' });
      load();
    } else {
      toast({ variant: 'destructive', title: 'Delete failed', description: result.error ?? undefined });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Images: public/bosses/{'{name}'}.png and public/map/m_{'{name}'}.png (name lowercased, no spaces)
        </p>
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add boss
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Spawn</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bosses.map((boss) => (
            <TableRow key={boss.id}>
              <TableCell>{boss.name}</TableCell>
              <TableCell>{boss.level}</TableCell>
              <TableCell>{boss.location}</TableCell>
              <TableCell className="text-xs">{boss.spawn_time}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(boss)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(boss.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing && editing.id > 0 ? 'Edit boss' : 'New boss'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 py-2">
              <div>
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Level</Label>
                  <Input
                    type="number"
                    value={editing.level}
                    onChange={(e) => setEditing({ ...editing, level: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div>
                  <Label>Respawn (min)</Label>
                  <Input
                    type="number"
                    value={editing.respawn_cooldown ?? ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        respawn_cooldown: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
              </div>
              <div>
                <Label>Spawn time</Label>
                <Input value={editing.spawn_time} onChange={(e) => setEditing({ ...editing, spawn_time: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.is_fixed_spawn}
                  onChange={(e) => setEditing({ ...editing, is_fixed_spawn: e.target.checked })}
                />
                Fixed spawn
              </label>
              {editing.name && (
                <p className="text-xs text-muted-foreground">
                  Assets: /bosses/{normalizeBossAssetName(editing.name)}.png, /map/m_{normalizeBossAssetName(editing.name)}.png
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader className="h-4 w-4" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AvatarsAdmin() {
  const { toast } = useToast();
  const [avatars, setAvatars] = useState<AdminAvatarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAvatarRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { avatars: data, error } = await getAdminAvatars();
    if (error) toast({ variant: 'destructive', title: 'Avatars', description: error });
    setAvatars(data);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (avatar: AdminAvatarRow) => {
    setEditing({ ...avatar });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const result = await upsertAdminAvatar({
      id: editing.id,
      name: editing.name,
      grade: editing.grade,
      image_url: editing.image_url,
    });
    setSaving(false);
    if (result.success) {
      toast({ title: 'Avatar saved' });
      setDialogOpen(false);
      load();
    } else {
      toast({ variant: 'destructive', title: 'Save failed', description: result.error ?? undefined });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        v1: edit name, grade, image_url. Stats and fated relationships are read-only (edit via SQL if needed).
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Image URL</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {avatars.map((avatar) => (
            <TableRow key={avatar.id}>
              <TableCell>{avatar.id}</TableCell>
              <TableCell>{avatar.name}</TableCell>
              <TableCell>{avatar.grade}</TableCell>
              <TableCell className="text-xs truncate max-w-[200px]">{avatar.image_url}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => openEdit(avatar)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit avatar — {editing?.name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 py-2">
              <div>
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label>Grade</Label>
                <Input value={editing.grade} onChange={(e) => setEditing({ ...editing, grade: e.target.value })} />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  value={editing.image_url ?? ''}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value || null })}
                />
              </div>
              {editing.avatar_stats && editing.avatar_stats.length > 0 && (
                <div>
                  <Label>Stats (read-only)</Label>
                  <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                    {editing.avatar_stats.map((s) => (
                      <li key={s.id}>
                        {s.attribute}: {s.value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {editing.avatar_fated_relationships && (
                <div>
                  <Label>Fated relationship (read-only)</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {editing.avatar_fated_relationships.name}: {editing.avatar_fated_relationships.description}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader className="h-4 w-4" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

