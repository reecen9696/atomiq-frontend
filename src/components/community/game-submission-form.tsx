/**
 * Game Submission Form Component
 * Multi-step form for submitting community games
 */

'use client';

import { useState } from 'react';
import { Upload, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { COMMUNITY_GAME_SECURITY } from '@/config/community-security';
import { useCommunityStore } from '@/stores/community-store';
import type { GameSubmission } from '@/types/community-games';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, name: 'Game Info', description: 'Basic information' },
  { id: 2, name: 'Configuration', description: 'Game settings' },
  { id: 3, name: 'Upload', description: 'Files & assets' },
  { id: 4, name: 'Review', description: 'Final review' },
];

const CATEGORIES = [
  { value: 'classic', label: 'Classic' },
  { value: 'slots', label: 'Slots' },
  { value: 'table', label: 'Table Games' },
  { value: 'arcade', label: 'Arcade' },
];

export function GameSubmissionForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'classic',
    declaredRTP: 0.97,
    maxMultiplier: 100,
    minBet: 0.01,
    maxBet: 10,
    sourceCodeUrl: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [bundleFile, setBundleFile] = useState<File | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { submitGame, submitting } = useCommunityStore();

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!thumbnailFile || !bundleFile) {
      toast.error('Please upload all required files');
      return;
    }

    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    const submission: GameSubmission = {
      ...formData,
      thumbnailFile,
      bundleFile,
    };

    const success = await submitGame(submission);
    if (success) {
      toast.success('Game submitted successfully! It will be reviewed shortly.');
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'classic',
        declaredRTP: 0.97,
        maxMultiplier: 100,
        minBet: 0.01,
        maxBet: 10,
        sourceCodeUrl: '',
      });
      setThumbnailFile(null);
      setBundleFile(null);
      setTermsAccepted(false);
      setCurrentStep(1);
    } else {
      toast.error('Failed to submit game. Please try again.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  currentStep >= step.id
                    ? 'border-primary-purple bg-primary-purple text-white'
                    : 'border-casino-border bg-casino-card text-white/40'
                }`}
              >
                {currentStep > step.id ? <Check size={20} /> : step.id}
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-white">{step.name}</p>
                <p className="text-xs text-white/60">{step.description}</p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div className="mx-4 h-0.5 w-16 bg-casino-border lg:w-32" />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="rounded-lg border border-casino-border bg-casino-card p-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="mb-4 text-2xl font-bold text-white">Game Information</h2>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Game Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-sm border border-casino-border bg-casino-bg px-4 py-2 text-white focus:border-primary-purple focus:outline-none"
                placeholder="Enter game title"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full rounded-sm border border-casino-border bg-casino-bg px-4 py-2 text-white focus:border-primary-purple focus:outline-none"
                rows={4}
                placeholder="Describe your game"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full rounded-sm border border-casino-border bg-casino-bg px-4 py-2 text-white focus:border-primary-purple focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="mb-4 text-2xl font-bold text-white">Configuration</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Declared RTP (%)
                </label>
                <input
                  type="number"
                  value={formData.declaredRTP * 100}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      declaredRTP: parseFloat(e.target.value) / 100,
                    })
                  }
                  min={COMMUNITY_GAME_SECURITY.MATH_VERIFICATION.MIN_ALLOWED_RTP * 100}
                  max={COMMUNITY_GAME_SECURITY.MATH_VERIFICATION.MAX_ALLOWED_RTP * 100}
                  step={0.1}
                  className="w-full rounded-sm border border-casino-border bg-casino-bg px-4 py-2 text-white focus:border-primary-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Max Multiplier
                </label>
                <input
                  type="number"
                  value={formData.maxMultiplier}
                  onChange={(e) =>
                    setFormData({ ...formData, maxMultiplier: parseInt(e.target.value) })
                  }
                  max={COMMUNITY_GAME_SECURITY.MATH_VERIFICATION.MAX_MULTIPLIER_CAP}
                  className="w-full rounded-sm border border-casino-border bg-casino-bg px-4 py-2 text-white focus:border-primary-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Min Bet (SOL)
                </label>
                <input
                  type="number"
                  value={formData.minBet}
                  onChange={(e) =>
                    setFormData({ ...formData, minBet: parseFloat(e.target.value) })
                  }
                  step={0.01}
                  min={0.01}
                  className="w-full rounded-sm border border-casino-border bg-casino-bg px-4 py-2 text-white focus:border-primary-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Max Bet (SOL)
                </label>
                <input
                  type="number"
                  value={formData.maxBet}
                  onChange={(e) =>
                    setFormData({ ...formData, maxBet: parseFloat(e.target.value) })
                  }
                  step={0.1}
                  className="w-full rounded-sm border border-casino-border bg-casino-bg px-4 py-2 text-white focus:border-primary-purple focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Source Code URL (Optional)
              </label>
              <input
                type="url"
                value={formData.sourceCodeUrl}
                onChange={(e) =>
                  setFormData({ ...formData, sourceCodeUrl: e.target.value })
                }
                className="w-full rounded-sm border border-casino-border bg-casino-bg px-4 py-2 text-white focus:border-primary-purple focus:outline-none"
                placeholder="https://github.com/..."
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="mb-4 text-2xl font-bold text-white">Upload Files</h2>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Game Thumbnail
              </label>
              <div className="flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-casino-border bg-casino-bg px-4 py-2 text-white hover:bg-white/5">
                  <Upload size={18} />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {thumbnailFile && (
                  <span className="text-sm text-white/60">{thumbnailFile.name}</span>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Game Bundle (ZIP)
              </label>
              <div className="flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-casino-border bg-casino-bg px-4 py-2 text-white hover:bg-white/5">
                  <Upload size={18} />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setBundleFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {bundleFile && (
                  <span className="text-sm text-white/60">{bundleFile.name}</span>
                )}
              </div>
              <p className="mt-2 text-xs text-white/60">
                Max size: {COMMUNITY_GAME_SECURITY.RATE_LIMITS.MAX_SUBMISSION_SIZE_MB}MB
              </p>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="mb-4 text-2xl font-bold text-white">Review & Submit</h2>

            <div className="rounded-sm border border-casino-border bg-casino-bg p-4">
              <h3 className="mb-2 font-semibold text-white">Game Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-white/60">Title:</dt>
                  <dd className="text-white">{formData.title}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/60">Category:</dt>
                  <dd className="text-white">{formData.category}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/60">RTP:</dt>
                  <dd className="text-white">{(formData.declaredRTP * 100).toFixed(1)}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/60">Max Multiplier:</dt>
                  <dd className="text-white">{formData.maxMultiplier}x</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/60">Bet Range:</dt>
                  <dd className="text-white">
                    {formData.minBet} - {formData.maxBet} SOL
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-white/70">
                I confirm that this game uses only the platform's VRF for randomness, does
                not contain malicious code, and complies with all security requirements.
              </label>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between border-t border-casino-border pt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 rounded-sm border border-casino-border bg-casino-bg px-4 py-2 text-white transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            <span>Previous</span>
          </button>

          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-sm bg-primary-purple px-4 py-2 text-white transition-colors hover:bg-primary-purple-hover"
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !termsAccepted}
              className="rounded-sm bg-primary-purple px-6 py-2 font-semibold text-white transition-colors hover:bg-primary-purple-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Game'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
