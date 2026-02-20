import { ScalarApiReference } from '@scalar/sveltekit';
import type { RequestHandler } from './$types';

const spec = {
	openapi: '3.1.0',
	info: {
		title: 'ATS Screener API',
		version: '1.0.0',
		description:
			'Free ATS resume scoring API that simulates how real enterprise HCMS platforms (Workday, Taleo, iCIMS, Greenhouse, Lever, SuccessFactors) parse and score resumes. Powered by a multi-provider LLM fallback chain (Gemini → Groq → Cerebras).'
	},
	servers: [{ url: '/', description: 'Current environment' }],
	paths: {
		'/api/analyze': {
			post: {
				operationId: 'analyze',
				summary: 'Analyze a resume against ATS platforms',
				description:
					'Sends resume text (and optional job description) to the LLM scoring engine. Returns structured scores from 6 real ATS platform perspectives. Falls back through providers (Gemini → Groq → Cerebras) if any fail.',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								oneOf: [
									{
										type: 'object',
										required: ['mode', 'resumeText'],
										properties: {
											mode: {
												type: 'string',
												enum: ['full-score'],
												description: 'Score a resume against all 6 ATS platforms'
											},
											resumeText: {
												type: 'string',
												description: 'Raw text extracted from the resume (PDF/DOCX)',
												maxLength: 10000
											},
											jobDescription: {
												type: 'string',
												description:
													'Optional job description for targeted scoring. Without this, scores reflect general ATS readiness.',
												maxLength: 5000
											}
										}
									},
									{
										type: 'object',
										required: ['mode', 'jobDescription'],
										properties: {
											mode: {
												type: 'string',
												enum: ['analyze-jd'],
												description: 'Analyze a job description to extract requirements'
											},
											jobDescription: {
												type: 'string',
												description: 'Full text of the job description',
												maxLength: 5000
											}
										}
									}
								]
							},
							examples: {
								'full-score': {
									summary: 'Score resume (general mode)',
									value: {
										mode: 'full-score',
										resumeText:
											'John Doe\nSoftware Engineer\n5 years experience in React, TypeScript, Node.js...'
									}
								},
								'full-score-targeted': {
									summary: 'Score resume against job description',
									value: {
										mode: 'full-score',
										resumeText:
											'John Doe\nSoftware Engineer\n5 years experience in React, TypeScript, Node.js...',
										jobDescription:
											'We are looking for a Senior Frontend Engineer with 5+ years of React experience...'
									}
								},
								'analyze-jd': {
									summary: 'Analyze job description',
									value: {
										mode: 'analyze-jd',
										jobDescription:
											'We are looking for a Senior Frontend Engineer with 5+ years of React experience...'
									}
								}
							}
						}
					}
				},
				responses: {
					'200': {
						description: 'Scoring results from 6 ATS platforms',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										results: {
											type: 'array',
											items: {
												type: 'object',
												properties: {
													system: {
														type: 'string',
														description: 'ATS platform name',
														enum: [
															'Workday',
															'Taleo',
															'iCIMS',
															'Greenhouse',
															'Lever',
															'SuccessFactors'
														]
													},
													vendor: { type: 'string', description: 'Platform vendor' },
													overallScore: {
														type: 'integer',
														minimum: 0,
														maximum: 100,
														description: 'Weighted composite score for this platform'
													},
													passesFilter: {
														type: 'boolean',
														description:
															'Whether the resume would pass initial screening on this platform'
													},
													breakdown: {
														type: 'object',
														properties: {
															formatting: {
																type: 'object',
																properties: {
																	score: { type: 'integer', minimum: 0, maximum: 100 },
																	issues: {
																		type: 'array',
																		items: { type: 'string' }
																	},
																	details: {
																		type: 'array',
																		items: { type: 'string' }
																	}
																}
															},
															keywordMatch: {
																type: 'object',
																properties: {
																	score: { type: 'integer', minimum: 0, maximum: 100 },
																	matched: {
																		type: 'array',
																		items: { type: 'string' }
																	},
																	missing: {
																		type: 'array',
																		items: { type: 'string' }
																	},
																	synonymMatched: {
																		type: 'array',
																		items: { type: 'string' }
																	}
																}
															},
															sections: {
																type: 'object',
																properties: {
																	score: { type: 'integer', minimum: 0, maximum: 100 },
																	present: {
																		type: 'array',
																		items: { type: 'string' }
																	},
																	missing: {
																		type: 'array',
																		items: { type: 'string' }
																	}
																}
															},
															experience: {
																type: 'object',
																properties: {
																	score: { type: 'integer', minimum: 0, maximum: 100 },
																	quantifiedBullets: { type: 'integer' },
																	totalBullets: { type: 'integer' },
																	actionVerbCount: { type: 'integer' },
																	highlights: {
																		type: 'array',
																		items: { type: 'string' }
																	}
																}
															},
															education: {
																type: 'object',
																properties: {
																	score: { type: 'integer', minimum: 0, maximum: 100 },
																	notes: {
																		type: 'array',
																		items: { type: 'string' }
																	}
																}
															}
														}
													},
													suggestions: {
														type: 'array',
														items: { type: 'string' },
														description: 'Platform-specific improvement suggestions'
													}
												}
											}
										},
										_provider: {
											type: 'string',
											description: 'Which LLM provider handled the request',
											enum: ['gemini', 'groq', 'cerebras']
										},
										_fallback: {
											type: 'boolean',
											description: 'Whether fallback was used'
										}
									}
								}
							}
						}
					},
					'400': {
						description: 'Invalid request',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										message: { type: 'string' }
									}
								}
							}
						}
					},
					'429': {
						description: 'Rate limit exceeded (10 req/min, 200 req/day per IP)',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: { type: 'string' }
									}
								}
							}
						}
					},
					'502': {
						description: 'LLM response could not be parsed',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: { type: 'string' },
										fallback: { type: 'boolean' }
									}
								}
							}
						}
					},
					'503': {
						description: 'All LLM providers failed or no API keys configured',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: { type: 'string' },
										fallback: { type: 'boolean' }
									}
								}
							}
						}
					}
				}
			}
		}
	}
};

const render = ScalarApiReference({
	content: JSON.stringify(spec),
	theme: 'moon'
});

export const GET: RequestHandler = () => {
	return render();
};
