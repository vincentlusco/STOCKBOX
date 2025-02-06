import cheerio from 'cheerio';
import axios from 'axios';

export class COTParser {
  constructor() {
    this.baseUrl = 'https://www.cftc.gov/dea/futures/';
  }

  async fetchCOTData(symbol) {
    try {
      // Map futures symbol to CFTC code
      const cftcCode = this.getCFTCCode(symbol);
      const url = `${this.baseUrl}dea${cftcCode}.htm`;
      
      const response = await axios.get(url);
      return this.parseCOTReport(response.data);
    } catch (error) {
      console.error('Error fetching COT data:', error);
      throw new Error('Unable to fetch COT data');
    }
  }

  parseCOTReport(html) {
    const $ = cheerio.load(html);
    
    // Find the latest report table
    const table = $('table').last();
    const rows = table.find('tr');

    // Extract data from the latest row
    const latestData = rows.eq(1).find('td');
    const previousData = rows.eq(2).find('td');

    return {
      reportDate: this.parseDate(latestData.eq(0).text()),
      
      // Commercial positions
      commercialLong: this.parseNumber(latestData.eq(3).text()),
      commercialShort: this.parseNumber(latestData.eq(4).text()),
      commercialNet: this.parseNumber(latestData.eq(5).text()),
      
      // Non-Commercial positions
      nonCommercialLong: this.parseNumber(latestData.eq(6).text()),
      nonCommercialShort: this.parseNumber(latestData.eq(7).text()),
      nonCommercialNet: this.parseNumber(latestData.eq(8).text()),
      
      // Changes from previous week
      commercialNetChange: this.calculateChange(
        this.parseNumber(latestData.eq(5).text()),
        this.parseNumber(previousData.eq(5).text())
      ),
      nonCommercialNetChange: this.calculateChange(
        this.parseNumber(latestData.eq(8).text()),
        this.parseNumber(previousData.eq(8).text())
      ),

      // Additional metrics
      totalOpenInterest: this.parseNumber(latestData.eq(1).text()),
      nonReportable: this.parseNumber(latestData.eq(9).text()),
      
      // Position concentrations
      commercialConcentration: this.calculateConcentration(
        this.parseNumber(latestData.eq(3).text()) + this.parseNumber(latestData.eq(4).text()),
        this.parseNumber(latestData.eq(1).text())
      )
    };
  }

  // Helper methods
  parseNumber(text) {
    return parseInt(text.replace(/,/g, '')) || 0;
  }

  parseDate(text) {
    return new Date(text).toISOString().split('T')[0];
  }

  calculateChange(current, previous) {
    return current - previous;
  }

  calculateConcentration(positions, totalOI) {
    return totalOI ? positions / totalOI : 0;
  }

  getCFTCCode(symbol) {
    // Map common futures symbols to CFTC codes
    const cftcMap = {
      'ES': '13874', // E-mini S&P 500
      'NQ': '13874A', // E-mini NASDAQ
      'CL': '067651', // Crude Oil
      'GC': '088691', // Gold
      'SI': '084691', // Silver
      'ZC': '002602', // Corn
      'ZW': '001602', // Wheat
      'ZS': '005602', // Soybeans
      // Add more mappings as needed
    };

    return cftcMap[symbol] || symbol;
  }
}

export const cotParser = new COTParser();