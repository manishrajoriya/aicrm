import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      leadId,
      organization = 'School',
      contactName = 'Contact',
      title = 'Meeting Reminder',
      scheduledAt,
      minutesBefore = 10,
      meetingLink,
    } = body;

    if (!scheduledAt) {
      return NextResponse.json({ error: 'scheduledAt is required' }, { status: 400 });
    }

    const meetingDate = new Date(scheduledAt);
    if (isNaN(meetingDate.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledAt format' }, { status: 400 });
    }

    // Calculate time to send the push reminder
    const sendAfterTime = new Date(meetingDate.getTime() - Number(minutesBefore) * 60 * 1000);
    const now = new Date();

    // If meeting is already in the past or reminder time has passed, don't schedule in the past
    const effectiveSendAfter = sendAfterTime.getTime() > now.getTime()
      ? sendAfterTime
      : new Date(now.getTime() + 10 * 1000); // 10 seconds from now

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    // Graceful fallback if OneSignal credentials are not configured yet
    if (!appId || !apiKey) {
      return NextResponse.json({
        success: true,
        simulated: true,
        message:
          'OneSignal keys not configured in .env.local. In-app reminder banner will handle this alert.',
        sendAfter: effectiveSendAfter.toISOString(),
      });
    }

    // Format display time (e.g., 11:30 AM)
    const formattedMeetingTime = meetingDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const destinationUrl = meetingLink?.trim() || `/leads/${leadId}`;

    const oneSignalPayload: Record<string, any> = {
      app_id: appId,
      headings: {
        en: `📅 Meeting in ${minutesBefore}m: ${organization}`,
      },
      contents: {
        en: `${title} with ${contactName} starts at ${formattedMeetingTime}. Click to join.`,
      },
      url: destinationUrl,
      send_after: effectiveSendAfter.toISOString(),
      web_buttons: [
        {
          id: 'join-call',
          text: meetingLink ? 'Join Call' : 'Open Lead',
          url: destinationUrl,
        },
      ],
    };

    // Target specific staff user if userId is provided
    if (userId) {
      oneSignalPayload.include_aliases = {
        external_id: [userId],
      };
      oneSignalPayload.target_channel = 'push';
    } else {
      oneSignalPayload.included_segments = ['Subscribed Users'];
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify(oneSignalPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal API error:', result);
      return NextResponse.json(
        { error: result.errors?.[0] || 'Failed to schedule OneSignal notification' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      notificationId: result.id,
      sendAfter: effectiveSendAfter.toISOString(),
      recipients: result.recipients,
    });
  } catch (error: any) {
    console.error('Error in schedule-meeting API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
