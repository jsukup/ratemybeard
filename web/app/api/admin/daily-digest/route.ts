import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple password check for admin access
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ratemybeard2025';

interface DigestStats {
  flaggedImages: number;
  pendingReports: number;
  newReportsToday: number;
  flaggedImagesData: any[];
}

// GET: Generate daily digest of flagged content
export async function GET(request: NextRequest) {
  try {
    // Check admin password
    const password = request.headers.get('x-admin-password');
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid admin password.' },
        { status: 401 }
      );
    }

    // Get today's date range
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Get flagged images that need review
    const { data: flaggedImages, error: flaggedError } = await supabase
      .rpc('get_flagged_images', { limit_count: 100 });

    if (flaggedError) {
      console.error('Error fetching flagged images:', flaggedError);
      return NextResponse.json(
        { error: 'Failed to fetch flagged images' },
        { status: 500 }
      );
    }

    // Get reports created today
    const { data: todayReports, error: todayError } = await supabase
      .from('reports')
      .select('*')
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString());

    if (todayError) {
      console.error('Error fetching today reports:', todayError);
      return NextResponse.json(
        { error: 'Failed to fetch today reports' },
        { status: 500 }
      );
    }

    // Get pending reports count
    const { data: pendingReports, error: pendingError } = await supabase
      .from('reports')
      .select('id')
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Error fetching pending reports:', pendingError);
      return NextResponse.json(
        { error: 'Failed to fetch pending reports' },
        { status: 500 }
      );
    }

    const digestStats: DigestStats = {
      flaggedImages: (flaggedImages || []).length,
      pendingReports: (pendingReports || []).length,
      newReportsToday: (todayReports || []).length,
      flaggedImagesData: flaggedImages || []
    };

    // Check if there's anything to report
    const hasContent = digestStats.flaggedImages > 0 || 
                      digestStats.newReportsToday > 0 || 
                      digestStats.pendingReports > 0;

    return NextResponse.json({
      success: true,
      date: today.toISOString().split('T')[0],
      hasContent,
      stats: digestStats,
      summary: generateDigestSummary(digestStats),
      flaggedImages: digestStats.flaggedImagesData.slice(0, 10) // Limit to top 10 for digest
    });

  } catch (error) {
    console.error('Unexpected error in daily digest:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Send digest notification (webhook/email)
export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const password = request.headers.get('x-admin-password');
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid admin password.' },
        { status: 401 }
      );
    }

    // Get digest data
    const digestResponse = await GET(request);
    const digestData = await digestResponse.json();

    if (!digestData.success) {
      return NextResponse.json(
        { error: 'Failed to generate digest data' },
        { status: 500 }
      );
    }

    // Only send notification if there's content to report
    if (!digestData.hasContent) {
      return NextResponse.json({
        success: true,
        message: 'No content to report today - notification not sent',
        sent: false
      });
    }

    const webhookUrl = process.env.ADMIN_WEBHOOK_URL;
    const adminEmail = process.env.ADMIN_EMAIL;

    let notificationSent = false;
    const results: any[] = [];

    // Send webhook notification if configured
    if (webhookUrl) {
      try {
        const webhookPayload = {
          type: 'daily_digest',
          date: digestData.date,
          stats: digestData.stats,
          summary: digestData.summary,
          urgent: digestData.stats.flaggedImages >= 5 // Mark as urgent if 5+ flagged images
        };

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'RateMyBeard-DailyDigest/1.0'
          },
          body: JSON.stringify(webhookPayload)
        });

        if (webhookResponse.ok) {
          results.push({ type: 'webhook', success: true, status: webhookResponse.status });
          notificationSent = true;
        } else {
          results.push({ 
            type: 'webhook', 
            success: false, 
            status: webhookResponse.status,
            error: await webhookResponse.text()
          });
        }
      } catch (error) {
        results.push({ 
          type: 'webhook', 
          success: false,
          error: error instanceof Error ? error.message : 'Unknown webhook error'
        });
      }
    }

    // Send email notification if configured (placeholder for future implementation)
    if (adminEmail) {
      // TODO: Implement email sending via service like SendGrid, AWS SES, etc.
      results.push({
        type: 'email',
        success: false,
        error: 'Email notifications not implemented yet'
      });
    }

    return NextResponse.json({
      success: true,
      sent: notificationSent,
      digest: digestData,
      notifications: results,
      message: notificationSent ? 
        'Daily digest notification sent successfully' : 
        'No notification methods configured or all failed'
    });

  } catch (error) {
    console.error('Unexpected error sending daily digest:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateDigestSummary(stats: DigestStats): string {
  const parts: string[] = [];
  
  if (stats.flaggedImages > 0) {
    parts.push(`${stats.flaggedImages} image${stats.flaggedImages !== 1 ? 's' : ''} awaiting moderation`);
  }
  
  if (stats.newReportsToday > 0) {
    parts.push(`${stats.newReportsToday} new report${stats.newReportsToday !== 1 ? 's' : ''} today`);
  }
  
  if (stats.pendingReports > 0) {
    parts.push(`${stats.pendingReports} total pending report${stats.pendingReports !== 1 ? 's' : ''}`);
  }
  
  if (parts.length === 0) {
    return 'No moderation actions required today';
  }
  
  return parts.join(', ');
}

// Handle other HTTP methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch digest or POST to send notifications.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch digest or POST to send notifications.' },
    { status: 405 }
  );
}