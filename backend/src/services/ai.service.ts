import axios from 'axios';
import { IncidentCategory, IncidentSeverity } from '../models/types';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

interface ClassificationResult {
  category: IncidentCategory;
  confidence: number;
  modelVersion: string;
}

interface SeverityResult {
  severity: IncidentSeverity;
  confidence: number;
  modelVersion: string;
}

// Rule-based heuristic fallback if AI service is temporarily unavailable
function heuristicClassify(text: string): IncidentCategory {
  const lower = text.toLowerCase();
  if (lower.includes('snatch') || lower.includes('stole') || lower.includes('theft') || lower.includes('pickpocket')) {
    return 'THEFT_SNATCHING';
  }
  if (lower.includes('assault') || lower.includes('hit') || lower.includes('attack') || lower.includes('beat')) {
    return 'ASSAULT';
  }
  if (lower.includes('rob') || lower.includes('knife') || lower.includes('gun') || lower.includes('held up')) {
    return 'ROBBERY';
  }
  if (lower.includes('harass') || lower.includes('stalk') || lower.includes('eve-teas') || lower.includes('threat')) {
    return 'HARASSMENT';
  }
  if (lower.includes('break-in') || lower.includes('burglary') || lower.includes('entered house') || lower.includes('locks cut')) {
    return 'BURGLARY';
  }
  if (lower.includes('vandal') || lower.includes('graffiti') || lower.includes('damaged property') || lower.includes('broken glass')) {
    return 'VANDALISM';
  }
  if (lower.includes('scam') || lower.includes('otp') || lower.includes('fraud') || lower.includes('cheated money')) {
    return 'FRAUD';
  }
  if (lower.includes('hack') || lower.includes('phishing') || lower.includes('cyber') || lower.includes('extortion')) {
    return 'CYBERCRIME';
  }
  if (lower.includes('bike') || lower.includes('car') || lower.includes('vehicle') || lower.includes('scooter') || lower.includes('hit and run')) {
    return 'VEHICLE_RELATED';
  }
  return 'OTHER';
}

function heuristicSeverity(category: IncidentCategory): IncidentSeverity {
  switch (category) {
    case 'ROBBERY':
    case 'ASSAULT':
      return 'HIGH';
    case 'BURGLARY':
    case 'CYBERCRIME':
    case 'THEFT_SNATCHING':
      return 'MEDIUM';
    case 'HARASSMENT':
    case 'VEHICLE_RELATED':
    case 'FRAUD':
      return 'MEDIUM';
    case 'VANDALISM':
    case 'OTHER':
    default:
      return 'LOW';
  }
}

export async function classifyIncident(description: string): Promise<ClassificationResult> {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/predict/classification`,
      { description },
      { timeout: 3000 }
    );
    if (response.data && response.data.category && response.data.category !== 'OTHER' && response.data.confidence > 0) {
      return {
        category: response.data.category as IncidentCategory,
        confidence: response.data.confidence,
        modelVersion: response.data.model_version || '1.0.0',
      };
    }
  } catch (err) {
    // Graceful fallback to heuristic
  }

  const category = heuristicClassify(description);
  return {
    category,
    confidence: category === 'OTHER' ? 0.45 : 0.82,
    modelVersion: 'heuristic-fallback',
  };
}

export async function estimateSeverity(
  description: string,
  category: IncidentCategory
): Promise<SeverityResult> {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/predict/severity`,
      { description, category },
      { timeout: 3000 }
    );
    if (response.data && response.data.severity && response.data.confidence > 0) {
      return {
        severity: response.data.severity as IncidentSeverity,
        confidence: response.data.confidence,
        modelVersion: response.data.model_version || '1.0.0',
      };
    }
  } catch (err) {
    // Graceful fallback to heuristic
  }

  const severity = heuristicSeverity(category);
  return {
    severity,
    confidence: 0.80,
    modelVersion: 'heuristic-fallback',
  };
}
