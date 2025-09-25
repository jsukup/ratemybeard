"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  EyeOff, 
  RefreshCw,
  Flag,
  Eye,
  Clock,
  BarChart3,
  Users,
  UserCheck,
  Trash2
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface ReportDetails {
  id: string;
  reason: string;
  details: string;
  created_at: string;
  status: string;
}

interface FlaggedImage {
  image_id: string;
  username: string;
  image_url: string;
  report_count: number;
  moderation_status: string;
  created_at: string;
  recent_reports: ReportDetails[];
}

interface AdminStats {
  pending: number;
  reviewed: number;
  dismissed: number;
}

const REPORT_REASON_LABELS: Record<string, string> = {
  'not_beard': 'Not Beard',
  'inappropriate': 'Inappropriate Content',
  'spam_fake': 'Spam/Fake',
  'other': 'Other'
};

export default function AdminDashboard() {
  const [password, setPassword] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [flaggedImages, setFlaggedImages] = useState<FlaggedImage[]>([]);
  const [stats, setStats] = useState<AdminStats>({ pending: 0, reviewed: 0, dismissed: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [moderatorId, setModeratorId] = useState<string>('admin');
  const [deleteConfirmImage, setDeleteConfirmImage] = useState<FlaggedImage | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'approve' | 'hide' | 'delete' | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState<boolean>(false);

  const authenticate = async () => {
    if (!password.trim()) {
      setError('Please enter the admin password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/reports', {
        method: 'GET',
        headers: {
          'x-admin-password': password
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setFlaggedImages(data.flaggedImages || []);
        setStats(data.stats || { pending: 0, reviewed: 0, dismissed: 0 });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Authentication error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/reports', {
        method: 'GET',
        headers: {
          'x-admin-password': password
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFlaggedImages(data.flaggedImages || []);
        setStats(data.stats || { pending: 0, reviewed: 0, dismissed: 0 });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to refresh data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async (imageId: string, action: 'approve' | 'hide') => {
    if (!moderatorId.trim()) {
      setError('Please enter a moderator ID');
      return;
    }

    setProcessingIds(prev => new Set(prev).add(imageId));
    setError('');

    try {
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({
          imageId: imageId,
          action: action,
          moderatorId: moderatorId
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Remove the image from the flagged list if it was processed
        setFlaggedImages(prev => prev.filter(img => img.image_id !== imageId));
        
        // Show success message briefly
        const successMessage = `Image ${action === 'approve' ? 'approved' : 'hidden'} successfully`;
        // You could add a toast notification here
        console.log(successMessage);
        
        // Refresh stats
        await refreshData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${action} image`);
      }
    } catch (err) {
      setError(`Network error while trying to ${action} image`);
      console.error('Moderation action error:', err);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  const handleDeletePermanently = async (imageId: string) => {
    if (!moderatorId.trim()) {
      setError('Please enter a moderator ID');
      return;
    }

    setDeletingIds(prev => new Set(prev).add(imageId));
    setError('');

    try {
      const response = await fetch('/api/admin/delete-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({
          imageId: imageId,
          moderatorId: moderatorId,
          confirmDelete: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Remove the image from the flagged list
        setFlaggedImages(prev => prev.filter(img => img.image_id !== imageId));
        
        // Close confirmation dialog
        setDeleteConfirmImage(null);
        
        // Show success message
        console.log('Image permanently deleted successfully');
        
        // Refresh stats
        await refreshData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete image permanently');
      }
    } catch (err) {
      setError('Network error while trying to delete image');
      console.error('Delete image error:', err);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  const handleSelectImage = (imageId: string, checked: boolean) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(imageId);
      } else {
        newSet.delete(imageId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedImages(new Set(flaggedImages.map(img => img.image_id)));
    } else {
      setSelectedImages(new Set());
    }
  };

  const handleBulkAction = async (action: 'approve' | 'hide' | 'delete') => {
    if (selectedImages.size === 0) {
      setError('No images selected for bulk action');
      return;
    }

    if (!moderatorId.trim()) {
      setError('Please enter a moderator ID');
      return;
    }

    setBulkProcessing(true);
    setError('');
    
    const selectedArray = Array.from(selectedImages);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    try {
      // Process images in batches of 3 to avoid overwhelming the server
      for (let i = 0; i < selectedArray.length; i += 3) {
        const batch = selectedArray.slice(i, i + 3);
        const batchPromises = batch.map(async (imageId) => {
          try {
            let response;
            
            if (action === 'delete') {
              response = await fetch('/api/admin/delete-image', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-admin-password': password
                },
                body: JSON.stringify({
                  imageId: imageId,
                  moderatorId: moderatorId,
                  confirmDelete: true
                })
              });
            } else {
              response = await fetch('/api/admin/reports', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-admin-password': password
                },
                body: JSON.stringify({
                  imageId: imageId,
                  action: action,
                  moderatorId: moderatorId
                })
              });
            }

            if (response.ok) {
              results.success++;
              return { imageId, success: true };
            } else {
              const errorData = await response.json();
              results.failed++;
              results.errors.push(`${imageId}: ${errorData.error || 'Unknown error'}`);
              return { imageId, success: false, error: errorData.error };
            }
          } catch (err) {
            results.failed++;
            results.errors.push(`${imageId}: Network error`);
            return { imageId, success: false, error: 'Network error' };
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches
        if (i + 3 < selectedArray.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Remove successfully processed images from the list
      setFlaggedImages(prev => prev.filter(img => !selectedImages.has(img.image_id)));
      
      // Clear selection
      setSelectedImages(new Set());
      
      // Show results
      if (results.success > 0) {
        console.log(`Bulk ${action}: ${results.success} images processed successfully`);
      }
      
      if (results.failed > 0) {
        setError(`Bulk ${action}: ${results.success} succeeded, ${results.failed} failed. First error: ${results.errors[0]}`);
      }
      
      // Refresh data
      await refreshData();
      
    } catch (error) {
      setError(`Bulk ${action} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBulkProcessing(false);
      setBulkAction(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'flagged': return 'bg-yellow-100 text-yellow-800';
      case 'hidden': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalReports = stats.pending + stats.reviewed + stats.dismissed;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <CardDescription>
              Enter the admin password to access the moderation dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && authenticate()}
                placeholder="Enter admin password"
                disabled={loading}
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={authenticate} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Authenticating...
                </div>
              ) : (
                'Access Dashboard'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              RateMyBeard Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Content moderation and user reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="moderator-id" className="text-sm">Moderator ID:</Label>
              <Input
                id="moderator-id"
                value={moderatorId}
                onChange={(e) => setModeratorId(e.target.value)}
                placeholder="admin"
                className="w-32"
              />
            </div>
            <Button variant="outline" onClick={refreshData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Flagged Images</p>
                  <p className="text-2xl font-bold text-orange-600">{flaggedImages.length}</p>
                </div>
                <Flag className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Reports</p>
                  <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reviewed Reports</p>
                  <p className="text-2xl font-bold text-green-600">{stats.reviewed}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold text-blue-600">{totalReports}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Flagged Images Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Flagged Images ({flaggedImages.length})
              </div>
              {selectedImages.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedImages.size} selected
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => setBulkAction('approve')}
                      disabled={bulkProcessing}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => setBulkAction('hide')}
                      disabled={bulkProcessing}
                    >
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hide
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-700 hover:bg-red-100"
                      onClick={() => setBulkAction('delete')}
                      disabled={bulkProcessing}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Images that have been reported by users and require moderation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {flaggedImages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                <p>No images currently require moderation.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedImages.size === flaggedImages.length && flaggedImages.length > 0}
                          onCheckedChange={(checked) => handleSelectAll(checked === true)}
                          aria-label="Select all images"
                        />
                      </TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Reports</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recent Reports</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedImages.map((image) => (
                      <TableRow key={image.image_id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedImages.has(image.image_id)}
                            onCheckedChange={(checked) => handleSelectImage(image.image_id, checked === true)}
                            disabled={processingIds.has(image.image_id) || deletingIds.has(image.image_id)}
                            aria-label={`Select image from ${image.username}`}
                          />
                        </TableCell>
                        <TableCell>
                          <img 
                            src={image.image_url} 
                            alt={`${image.username}'s submission`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {image.username}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {image.report_count} reports
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(image.moderation_status)}>
                            {image.moderation_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 max-w-xs">
                            {image.recent_reports?.slice(0, 3).map((report) => (
                              <div key={report.id} className="text-xs">
                                <span className="font-medium">
                                  {REPORT_REASON_LABELS[report.reason] || report.reason}
                                </span>
                                {report.details && (
                                  <p className="text-muted-foreground truncate">
                                    {report.details}
                                  </p>
                                )}
                                <p className="text-muted-foreground">
                                  {formatDate(report.created_at)}
                                </p>
                              </div>
                            ))}
                            {image.recent_reports?.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{image.recent_reports.length - 3} more...
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(image.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleModerationAction(image.image_id, 'approve')}
                              disabled={processingIds.has(image.image_id) || deletingIds.has(image.image_id)}
                              title="Approve image"
                            >
                              {processingIds.has(image.image_id) ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleModerationAction(image.image_id, 'hide')}
                              disabled={processingIds.has(image.image_id) || deletingIds.has(image.image_id)}
                              title="Hide image"
                            >
                              {processingIds.has(image.image_id) ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-700 border-red-700 hover:bg-red-100"
                              onClick={() => setDeleteConfirmImage(image)}
                              disabled={processingIds.has(image.image_id) || deletingIds.has(image.image_id)}
                              title="Delete permanently (cannot be undone)"
                            >
                              {deletingIds.has(image.image_id) ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmImage} onOpenChange={(open) => !open && setDeleteConfirmImage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Permanently Delete Image
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p className="font-medium text-red-700">
                ⚠️ This action cannot be undone!
              </p>
              <p>
                You are about to permanently delete this image and all related data:
              </p>
              {deleteConfirmImage && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-3">
                    <img 
                      src={deleteConfirmImage.image_url} 
                      alt={`${deleteConfirmImage.username}'s submission`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <p><strong>Username:</strong> {deleteConfirmImage.username}</p>
                      <p><strong>Reports:</strong> {deleteConfirmImage.report_count}</p>
                      <p><strong>Status:</strong> {deleteConfirmImage.moderation_status}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                <p><strong>This will permanently remove:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>The image record from the database</li>
                  <li>All user ratings for this image</li>
                  <li>All reports related to this image</li>
                  <li>The image file from storage</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmImage(null)}
              disabled={deleteConfirmImage && deletingIds.has(deleteConfirmImage.image_id)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmImage && handleDeletePermanently(deleteConfirmImage.image_id)}
              disabled={deleteConfirmImage && deletingIds.has(deleteConfirmImage.image_id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteConfirmImage && deletingIds.has(deleteConfirmImage.image_id) ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Permanently
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={!!bulkAction} onOpenChange={(open) => !open && setBulkAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {bulkAction === 'approve' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {bulkAction === 'hide' && <EyeOff className="h-5 w-5 text-red-600" />}
              {bulkAction === 'delete' && <Trash2 className="h-5 w-5 text-red-700" />}
              Bulk {bulkAction === 'approve' ? 'Approve' : bulkAction === 'hide' ? 'Hide' : 'Delete'} Images
            </DialogTitle>
            <DialogDescription>
              {bulkAction === 'delete' ? (
                <div className="space-y-2">
                  <p className="font-medium text-red-700">
                    ⚠️ This action cannot be undone!
                  </p>
                  <p>
                    You are about to permanently delete {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} and all related data:
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <p><strong>This will permanently remove for each image:</strong></p>
                    <ul className="list-disc list-inside ml-2">
                      <li>The image record from the database</li>
                      <li>All user ratings for this image</li>
                      <li>All reports related to this image</li>
                      <li>The image file from storage</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p>
                  You are about to {bulkAction} {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''}.
                  {bulkAction === 'hide' && ' Hidden images will be removed from the public leaderboard.'}
                  {bulkAction === 'approve' && ' Approved images will be cleared of all flags and reports.'}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setBulkAction(null)}
              disabled={bulkProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant={bulkAction === 'delete' ? 'destructive' : 'default'}
              onClick={() => bulkAction && handleBulkAction(bulkAction)}
              disabled={bulkProcessing}
              className={bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {bulkProcessing ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {bulkAction === 'approve' && <CheckCircle className="h-4 w-4" />}
                  {bulkAction === 'hide' && <EyeOff className="h-4 w-4" />}
                  {bulkAction === 'delete' && <Trash2 className="h-4 w-4" />}
                  {bulkAction === 'approve' ? 'Approve' : bulkAction === 'hide' ? 'Hide' : 'Delete'} {selectedImages.size} Image{selectedImages.size !== 1 ? 's' : ''}
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}