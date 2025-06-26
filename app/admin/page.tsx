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
  UserCheck
} from "lucide-react";

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
  'not_feet': 'Not Feet',
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
              RateMyFeet Admin Dashboard
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
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Flagged Images ({flaggedImages.length})
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
                              disabled={processingIds.has(image.image_id)}
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
                              disabled={processingIds.has(image.image_id)}
                            >
                              {processingIds.has(image.image_id) ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
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
    </div>
  );
}