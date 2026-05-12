import { Request, Response } from 'express';

interface AnalyticsData {
  totalContacts: number;
  totalLeads: number;
  totalRevenue: number;
  conversionRate: number;
  avgDealSize: number;
  topSources: { source: string; count: number }[];
  pipelineValue: { stage: string; value: number }[];
  monthlyTrend: { month: string; leads: number; revenue: number }[];
  predictions: {
    nextMonthLeads: number;
    nextMonthRevenue: number;
    churnRisk: number;
    recommendations: string[];
  };
}

interface BusinessMetrics {
  contactsAdded: number;
  dealsWon: number;
  revenueGenerated: number;
  messagesSent: number;
  appointmentsScheduled: number;
}

class AIAnalyticsService {
  
  // Get comprehensive analytics
  async getAnalytics(businessId: string): Promise<AnalyticsData> {
    // In production, this would query actual database
    // For demo, return mock data with AI predictions
    
    const mockData: AnalyticsData = {
      totalContacts: 1250,
      totalLeads: 342,
      totalRevenue: 2850000,
      conversionRate: 18.5,
      avgDealSize: 52000,
      topSources: [
        { source: 'WhatsApp', count: 450 },
        { source: 'Website', count: 320 },
        { source: 'Referral', count: 180 },
        { source: 'Social Media', count: 120 },
        { source: 'Ads', count: 80 },
      ],
      pipelineValue: [
        { stage: 'New Lead', value: 450000 },
        { stage: 'Contacted', value: 680000 },
        { stage: 'Qualified', value: 920000 },
        { stage: 'Proposal', value: 1250000 },
        { stage: 'Won', value: 2850000 },
      ],
      monthlyTrend: this.generateMonthlyTrend(),
      predictions: await this.generatePredictions(),
    };

    return mockData;
  }

  // Generate monthly trend data
  private generateMonthlyTrend() {
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    return months.map((month, index) => ({
      month,
      leads: 40 + Math.floor(Math.random() * 30) + index * 10,
      revenue: 350000 + Math.floor(Math.random() * 150000) + index * 50000,
    }));
  }

  // Generate AI predictions
  private async generatePredictions() {
    // In production, this would call OpenAI or use ML models
    // For demo, return simulated predictions
    
    const nextMonthLeads = Math.floor(80 + Math.random() * 40);
    const nextMonthRevenue = Math.floor(450000 + Math.random() * 200000);
    const churnRisk = Math.floor(5 + Math.random() * 10);
    
    const recommendations = this.generateRecommendations(nextMonthLeads, churnRisk);

    return {
      nextMonthLeads,
      nextMonthRevenue,
      churnRisk,
      recommendations,
    };
  }

  // Generate AI recommendations based on data
  private generateRecommendations(leads: number, churnRisk: number): string[] {
    const recommendations: string[] = [];

    if (leads > 100) {
      recommendations.push('📈 High lead volume expected - consider running a drip campaign');
    }

    if (churnRisk > 10) {
      recommendations.push('⚠️ High churn risk detected - reach out to at-risk customers');
    }

    recommendations.push('💡 Best time to send messages is between 10AM-12PM');
    recommendations.push('🎯 WhatsApp leads have 40% higher conversion rate');
    recommendations.push('📊 Consider offering a limited-time discount to close more deals');

    return recommendations;
  }

  // Get performance metrics
  getMetrics(businessId: string): BusinessMetrics {
    return {
      contactsAdded: Math.floor(Math.random() * 50) + 10,
      dealsWon: Math.floor(Math.random() * 15) + 3,
      revenueGenerated: Math.floor(Math.random() * 500000) + 100000,
      messagesSent: Math.floor(Math.random() * 2000) + 500,
      appointmentsScheduled: Math.floor(Math.random() * 20) + 5,
    };
  }

  // Get sales forecast
  async getSalesForecast(businessId: string, months: number = 3): Promise<{ forecast: { month: string; predicted: number; confidence: number }[] }> {
    const forecast = [];
    const monthNames = ['Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    for (let i = 0; i < Math.min(months, 5); i++) {
      const predicted = Math.floor(400000 + Math.random() * 300000 + i * 50000);
      forecast.push({
        month: monthNames[i],
        predicted,
        confidence: Math.floor(70 + Math.random() * 25),
      });
    }

    return { forecast };
  }

  // Compare performance (time periods)
  async comparePeriods(businessId: string, period1: string, period2: string): Promise<{ metric: string; change: number }[]> {
    // Compare current vs previous period
    return [
      { metric: 'Leads', change: Math.floor(Math.random() * 40) - 10 },
      { metric: 'Revenue', change: Math.floor(Math.random() * 30) - 5 },
      { metric: 'Conversion Rate', change: Math.floor(Math.random() * 20) - 5 },
      { metric: 'Avg Deal Size', change: Math.floor(Math.random() * 25) - 8 },
    ];
  }

  // Generate report
  async generateReport(businessId: string, type: 'weekly' | 'monthly' | 'quarterly'): Promise<{ summary: string; data: any }> {
    const analytics = await this.getAnalytics(businessId);
    const metrics = this.getMetrics(businessId);
    const forecast = await this.getSalesForecast(businessId);

    return {
      summary: this.generateReportSummary(type, analytics, metrics),
      data: {
        analytics,
        metrics,
        forecast,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  // Generate text summary
  private generateReportSummary(type: string, analytics: AnalyticsData, metrics: BusinessMetrics): string {
    return `
📊 ${type.toUpperCase()} REPORT

📈 Key Highlights:
• Total Contacts: ${analytics.totalContacts}
• Total Revenue: ₹${(analytics.totalRevenue / 100000).toFixed(1)}L
• Conversion Rate: ${analytics.conversionRate}%
• Pipeline Value: ₹${(analytics.pipelineValue.reduce((s, p) => s + p.value, 0) / 100000).toFixed(1)}L

🎯 This Month:
• New Contacts: ${metrics.contactsAdded}
• Deals Won: ${metrics.dealsWon}
• Revenue: ₹${(metrics.revenueGenerated / 100000).toFixed(1)}L
• Messages Sent: ${metrics.messagesSent}

📈 AI Predictions:
• Next Month Leads: ${analytics.predictions.nextMonthLeads}
• Expected Revenue: ₹${(analytics.predictions.nextMonthRevenue / 100000).toFixed(1)}L
• Churn Risk: ${analytics.predictions.churnRisk}%

💡 Recommendations:
${analytics.predictions.recommendations.map(r => `• ${r}`).join('\n')}
    `.trim();
  }

  // Get customer segments
  getCustomerSegments(businessId: string): { segment: string; count: number; value: number; growth: string }[] {
    return [
      { segment: 'Premium (₹1L+)', count: 45, value: 1500000, growth: '+25%' },
      { segment: 'Growth (₹50K-1L)', count: 120, value: 850000, growth: '+18%' },
      { segment: 'Standard (₹10K-50K)', count: 350, value: 420000, growth: '+12%' },
      { segment: 'New (First purchase)', count: 180, value: 180000, growth: '+45%' },
    ];
  }

  // Get activity heatmap
  getActivityHeatmap(businessId: string): { day: string; hour: number; count: number }[] {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatmap = [];
    
    days.forEach(day => {
      for (let hour = 9; hour <= 18; hour++) {
        heatmap.push({
          day,
          hour,
          count: Math.floor(Math.random() * 50),
        });
      }
    });
    
    return heatmap;
  }
}

export const aiAnalyticsService = new AIAnalyticsService();

// Route handlers
export const getAnalytics = async (req: Request, res: Response) => {
  const { businessId } = req.params;
  const data = await aiAnalyticsService.getAnalytics(businessId);
  res.json({ success: true, data });
};

export const getMetrics = (req: Request, res: Response) => {
  const { businessId } = req.params;
  const data = aiAnalyticsService.getMetrics(businessId);
  res.json({ success: true, data });
};

export const getSalesForecast = async (req: Request, res: Response) => {
  const { businessId } = req.params;
  const { months = 3 } = req.query;
  const data = await aiAnalyticsService.getSalesForecast(businessId, parseInt(months as string));
  res.json({ success: true, data });
};

export const getCustomerSegments = (req: Request, res: Response) => {
  const { businessId } = req.params;
  const data = aiAnalyticsService.getCustomerSegments(businessId);
  res.json({ success: true, data });
};

export const getActivityHeatmap = (req: Request, res: Response) => {
  const { businessId } = req.params;
  const data = aiAnalyticsService.getActivityHeatmap(businessId);
  res.json({ success: true, data });
};

export const generateReport = async (req: Request, res: Response) => {
  const { businessId } = req.params;
  const { type = 'weekly' } = req.body;
  const data = await aiAnalyticsService.generateReport(businessId, type);
  res.json({ success: true, data });
};