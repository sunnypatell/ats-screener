import { describe, it, expect } from 'vitest';
import { scoreExperience } from '$engine/scorer/experience-scorer';

describe('scoreExperience', () => {
	it('returns low score for empty bullets', () => {
		const result = scoreExperience([]);
		expect(result.score).toBeLessThanOrEqual(20);
		expect(result.totalBullets).toBe(0);
	});

	it('rewards quantified bullets', () => {
		const quantified = scoreExperience([
			'Increased revenue by 35% through process optimization',
			'Reduced costs by $500,000 annually',
			'Led a team of 12 engineers to deliver 3x faster',
			'Managed portfolio of $2M+ in client accounts',
			'Achieved top 5% performance rating'
		]);

		const plain = scoreExperience([
			'Worked on revenue optimization',
			'Handled cost reduction projects',
			'Led engineering team',
			'Managed client accounts',
			'Performed well'
		]);

		expect(quantified.score).toBeGreaterThan(plain.score);
		expect(quantified.quantifiedBullets).toBeGreaterThan(plain.quantifiedBullets);
	});

	it('rewards strong action verbs', () => {
		const result = scoreExperience([
			'Developed a microservices architecture for payment processing',
			'Led migration from monolith to distributed system',
			'Implemented CI/CD pipeline reducing deploy time by 70%',
			'Architected scalable data pipeline handling 1M events/day',
			'Optimized database queries improving response time 3x'
		]);

		expect(result.actionVerbCount).toBeGreaterThanOrEqual(4);
		expect(result.highlights.some((h) => h.includes('action verbs'))).toBe(true);
	});

	it('detects quantification patterns correctly', () => {
		const result = scoreExperience([
			'Grew user base from 10,000 to 100,000 users',
			'Reduced page load time by 40%',
			'Generated $1.2M in new revenue',
			'Managed budget of $500k',
			'Improved system uptime to 99.99%',
			'Delivered project 2 weeks ahead of schedule',
			'Processed 5 million transactions daily',
			'Trained 25 new team members'
		]);

		expect(result.quantifiedBullets).toBeGreaterThanOrEqual(6);
		expect(result.totalBullets).toBe(8);
	});

	it('caps score at 100', () => {
		const result = scoreExperience([
			'Increased revenue by 200%',
			'Reduced costs by $5M annually',
			'Led 50-person engineering organization',
			'Delivered 10x improvement in throughput',
			'Grew team from 5 to 50 engineers',
			'Managed $20M annual budget',
			'Achieved #1 market position',
			'Scaled platform to 10M+ users',
			'Reduced churn by 45%',
			'Launched 12 products in 18 months'
		]);

		expect(result.score).toBeLessThanOrEqual(100);
		expect(result.score).toBeGreaterThanOrEqual(0);
	});
});
