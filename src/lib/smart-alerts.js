// Smart Telegram Alerts with Inline Buttons
// Integrates Lifestyle Agent v2 with Telegram

const { Telegraf, Markup } = require('telegraf');
const { message } = require('telegraf/filters');

class SmartLifestyleAlerts {
  constructor(botToken, userId) {
    this.bot = new Telegraf(botToken);
    this.userId = userId;
    this.setupHandlers();
  }

  // Send proactive check-in with inline buttons
  async sendCheckIn(type, context) {
    const messages = {
      morning: {
        text: `🌅 Good morning Mat\n\nSleep: ${context.sleepDuration} (⚠️ below target)\nHRV: ${context.hrv}ms (↓ ${context.hrvDrop}% from baseline)\n\nTake 2 min for yourself before the day starts?`,
        buttons: [
          [Markup.button.callback('✅ Did breathing exercise', 'morning_breath')],
          [Markup.button.callback("💪 I'm good, thanks", 'morning_good')],
          [Markup.button.callback('😴 Rough night', 'morning_rough')]
        ]
      },
      midday: {
        text: `☀️ Midday check\n\nYou've been in meetings for ${context.meetingHours}h straight.\nStep outside? Even 2 minutes helps.`,
        buttons: [
          [Markup.button.callback('🚶 Did a walk', 'midday_walk')],
          [Markup.button.callback('⚡ In flow, skip today', 'midday_skip')],
          [Markup.button.callback('😵 Need a break', 'midday_break')]
        ]
      },
      evening: {
        text: `🌆 Evening wind-down\n\nScreen time: ${context.screenTime}h (📈 +${context.screenTimeDiff}h from avg)\nTomorrow: ${context.tomorrowMeetings} meetings before 11am\n\nConsider: Phone in other room by 10pm?`,
        buttons: [
          [Markup.button.callback('📱 On it', 'evening_onit')],
          [Markup.button.callback('📊 Too much to do', 'evening_busy')],
          [Markup.button.callback('😴 Already winding down', 'evening_done')]
        ]
      },
      pattern: {
        text: `⚠️ Pattern noticed\n\nYou've said "I'm fine" 4 times this week but:\n- Sleep: trending down\n- HRV: 22% below baseline\n- Screen time: up 3h/day\n\nSomething's off. Talk?`,
        buttons: [
          [Markup.button.callback('📞 Yes, call me', 'pattern_call')],
          [Markup.button.callback('💬 Text me instead', 'pattern_text')],
          [Markup.button.callback('✋ Just busy, not down', 'pattern_busy')]
        ]
      },
      sleepWarning: {
        text: `😴 Sleep Alert\n\nLast night: ${context.sleepHours}h\n3 night average: ${context.avg3Night}h\n\nYour body is asking for rest.`,
        buttons: [
          [Markup.button.callback('🎯 Early night tonight', 'sleep_early')],
          [Markup.button.callback('📅 Check my calendar', 'sleep_checkcal')],
          [Markup.button.callback('💊 Already planned', 'sleep_planned')]
        ]
      },
      stressSpike: {
        text: `💓 Stress Spike Detected\n\nHRV dropped ${context.hrvDrop}%\nResting HR elevated\n\nTake 5 minutes?`,
        buttons: [
          [Markup.button.callback('🧘 Starting breathe app now', 'stress_breathe')],
          [Markup.button.callback('🚶 Going for a walk', 'stress_walk')],
          [Markup.button.callback('🗣️ I need to talk', 'stress_talk')]
        ]
      }
    };

    const msg = messages[type];
    if (!msg) return;

    await this.bot.telegram.sendMessage(this.userId, msg.text, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(msg.buttons).reply_markup
    });
  }

  // Handle button responses
  setupHandlers() {
    this.bot.on('callback_query', async (ctx) => {
      const action = ctx.callbackQuery.data;
      
      // Acknowledge the button press
      await ctx.answerCbQuery();
      
      // Log the response
      await this.logResponse(action, ctx.callbackQuery.from.id);
      
      // Handle different response types
      switch(action) {
        // Morning responses
        case 'morning_breath':
          await ctx.editMessageText('🌅 Good morning Mat\n\n✅ Breathing exercise logged\n\nStarting the day grounded. 🙏');
          await this.logMetric('morning_routine', true);
          break;
        case 'morning_good':
          await ctx.editMessageText('🌅 Good morning Mat\n\n💪 Noted! Hope today is smooth.');
          break;
        case 'morning_rough':
          await ctx.editMessageText('🌅 Good morning Mat\n\n😴 Rough night noted. I\'ll check in lighter today. Take it easy.');
          await this.scheduleGentleCheckIn(4); // 4 hours later
          break;

        // Midday responses
        case 'midday_walk':
          await ctx.editMessageText('☀️ Midday check\n\n🚩 Walk logged! Fresh air magic. ✨');
          await this.logMetric('midday_movement', true);
          break;
        case 'midday_skip':
          await ctx.editMessageText('☀️ Midday check\n\n⚡ In flow - respect. I\'ll catch you later.');
          break;
        case 'midday_break':
          await ctx.editMessageText('☀️ Midday check\n\n😵 Break noted. 2 minutes outside. I\'ll wait.');
          break;

        // Evening responses
        case 'evening_onit':
          await ctx.editMessageText('🌆 Evening wind-down\n\n📱 Commitment noted. You\'ve got this.');
          break;
        case 'evening_busy':
          await ctx.editMessageText('🌆 Evening wind-down\n\n📊 Understood. Even 15 mins of downtime helps. Can you find that?');
          await this.sendFollowUp('sleep_15min', 2); // 2 hours later
          break;
        case 'evening_done':
          await ctx.editMessageText('🌆 Evening wind-down\n\n😴 Perfect. Sleep well. 🌙');
          break;

        // Pattern/escalation responses
        case 'pattern_call':
          await ctx.editMessageText('⚠️ Pattern noticed\n\n📞 Calling you now...');
          await this.initiateCall();
          break;
        case 'pattern_text':
          await ctx.editMessageText('⚠️ Pattern noticed\n\n💬 What\'s going on? I\'m here.');
          break;
        case 'pattern_busy':
          await ctx.editMessageText('⚠️ Pattern noticed\n\n✋ Got it. I\'ll keep an eye on the trends but back off for now.');
          break;

        // Sleep warning responses
        case 'sleep_early':
          await ctx.editMessageText('😴 Sleep Alert\n\n🎯 Early night committed. Protect that time.');
          await this.setReminder('wind_down', '21:30');
          break;
        case 'sleep_checkcal':
          await ctx.editMessageText('😴 Sleep Alert\n\n📅 Smart. Tomorrow: ' + await this.getMorningMeetings());
          break;
        case 'sleep_planned':
          await ctx.editMessageText('😴 Sleep Alert\n\n💊 Planned - good. Sleep is medicine.');
          break;

        // Stress responses
        case 'stress_breathe':
          await ctx.editMessageText('💓 Stress Spike\n\n🧘 Breathe app started. I\'ll check back in 5 mins.');
          await this.scheduleCheckIn(5, 'breathe_followup');
          break;
        case 'stress_walk':
          await ctx.editMessageText('💓 Stress Spike\n\n🚩 Walk started. Movement is medicine.');
          await this.logMetric('stress_walk', true);
          break;
        case 'stress_talk':
          await ctx.editMessageText('💓 Stress Spike\n\n🗣️ I\'m here. What do you need?');
          await this.initiateTextChat();
          break;
      }
    });
  }

  // Helper methods
  async logResponse(action, userId) {
    // Log to Supabase or file
    console.log(`[${new Date().toISOString()}] Response: ${action} from ${userId}`);
  }

  async logMetric(metric, value) {
    // Track health metrics
    console.log(`[Metric] ${metric}: ${value}`);
  }

  async scheduleGentleCheckIn(hours) {
    // Schedule a lighter check-in
    console.log(`[Schedule] Gentle check-in in ${hours}h`);
  }

  async sendFollowUp(type, hours) {
    console.log(`[FollowUp] ${type} in ${hours}h`);
  }

  async initiateCall() {
    // Trigger voice call or calendar block
    console.log('[Action] Initiating call protocol');
  }

  async initiateTextChat() {
    // Open direct message flow
    console.log('[Action] Opening text chat');
  }

  async setReminder(type, time) {
    console.log(`[Reminder] ${type} at ${time}`);
  }

  async getMorningMeetings() {
    // Fetch from calendar API
    return '3 meetings before noon';
  }

  async scheduleCheckIn(minutes, type) {
    console.log(`[Schedule] ${type} in ${minutes} mins`);
  }

  launch() {
    this.bot.launch();
    console.log('Smart Lifestyle Alerts bot running...');
  }
}

// Export for use
module.exports = { SmartLifestyleAlerts };
