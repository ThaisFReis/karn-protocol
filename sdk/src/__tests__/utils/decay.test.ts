/**
 * Tests for Mana decay calculation utility
 */

import { calculateMana } from '../../utils/decay.js';

describe('calculateMana', () => {
  const MEMBER_FLOOR = 5;
  const VACANCY_PERIOD = 15552000; // 180 days in seconds
  const ONE_DAY = 24 * 60 * 60;

  describe('Basic Calculations', () => {
    it('should return Member Floor for newly registered member with no badges', () => {
      const level = 0;
      const permanentLevel = 0;
      const expiry = Date.now() / 1000 + VACANCY_PERIOD;
      const currentTimestamp = Date.now() / 1000;

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      expect(mana).toBe(MEMBER_FLOOR);
    });

    it('should calculate correct Mana with full time remaining', () => {
      const level = 100;
      const permanentLevel = 0;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp + VACANCY_PERIOD;

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      // Mana = 5 (floor) + 100 (full level with full time) + 0 (permanent) = 105
      expect(mana).toBe(105);
    });

    it('should calculate correct Mana with partial time remaining (50%)', () => {
      const level = 100;
      const permanentLevel = 0;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp + (VACANCY_PERIOD / 2); // 90 days remaining

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      // bonus = floor(100 * (VACANCY_PERIOD/2) / VACANCY_PERIOD) = 50
      // Mana = 5 + 50 + 0 = 55
      expect(mana).toBe(55);
    });

    it('should return Member Floor when fully decayed (time expired)', () => {
      const level = 100;
      const permanentLevel = 0;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp - ONE_DAY; // Expired 1 day ago

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      // bonus = 0 (time expired)
      // Mana = 5 + 0 + 0 = 5
      expect(mana).toBe(MEMBER_FLOOR);
    });
  });

  describe('Permanent Level (Founder Badge)', () => {
    it('should include permanent level in Mana regardless of time', () => {
      const level = 100;
      const permanentLevel = 100;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp + VACANCY_PERIOD;

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      // decayingLevel = 100 - 100 = 0
      // bonus = 0
      // Mana = 5 + 0 + 100 = 105
      expect(mana).toBe(105);
    });

    it('should maintain permanent Mana even after expiry', () => {
      const level = 100;
      const permanentLevel = 100;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp - 365 * ONE_DAY; // Expired 1 year ago

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      // Permanent level never decays
      // Mana = 5 + 0 + 100 = 105
      expect(mana).toBe(105);
    });

    it('should handle mixed permanent and decaying levels', () => {
      const level = 150; // 50 permanent + 100 decaying
      const permanentLevel = 50;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp + VACANCY_PERIOD;

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      // decayingLevel = 150 - 50 = 100
      // bonus = 100 (full time)
      // Mana = 5 + 100 + 50 = 155
      expect(mana).toBe(155);
    });

    it('should calculate correct decay with mixed levels at 50% time', () => {
      const level = 150;
      const permanentLevel = 50;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp + (VACANCY_PERIOD / 2);

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      // decayingLevel = 100
      // bonus = floor(100 * 0.5) = 50
      // Mana = 5 + 50 + 50 = 105
      expect(mana).toBe(105);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero level', () => {
      const level = 0;
      const permanentLevel = 0;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp + VACANCY_PERIOD;

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      expect(mana).toBe(MEMBER_FLOOR);
    });

    it('should handle very large level values', () => {
      const level = 1000000;
      const permanentLevel = 0;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp + VACANCY_PERIOD;

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      expect(mana).toBe(MEMBER_FLOOR + 1000000);
    });

    it('should handle expiry exactly equal to current time', () => {
      const level = 100;
      const permanentLevel = 0;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp;

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      expect(mana).toBe(MEMBER_FLOOR);
    });

    it('should handle very far future expiry', () => {
      const level = 100;
      const permanentLevel = 0;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp + (10 * VACANCY_PERIOD); // 10x vacancy period

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      // bonus = floor(100 * (10 * VACANCY_PERIOD) / VACANCY_PERIOD) = 1000
      // Mana = 5 + 1000 + 0 = 1005
      expect(mana).toBe(1005);
    });

    it('should use floor function for fractional values', () => {
      const level = 3;
      const permanentLevel = 0;
      const currentTimestamp = 0;
      const expiry = VACANCY_PERIOD / 2; // 50% time

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      // bonus = floor(3 * 0.5) = floor(1.5) = 1
      // Mana = 5 + 1 + 0 = 6
      expect(mana).toBe(6);
    });
  });

  describe('Time Progression Scenarios', () => {
    it('should decrease Mana linearly over time', () => {
      const level = 100;
      const permanentLevel = 0;
      const startTime = 0;
      const expiry = VACANCY_PERIOD;

      // At start (100% time remaining)
      const manaAt0 = calculateMana(level, permanentLevel, expiry, startTime);
      expect(manaAt0).toBe(105);

      // At 25% time remaining
      const time25 = expiry - (VACANCY_PERIOD * 0.25);
      const manaAt25 = calculateMana(level, permanentLevel, expiry, time25);
      expect(manaAt25).toBe(30); // 5 + 25 + 0

      // At 50% time remaining
      const time50 = expiry - (VACANCY_PERIOD * 0.5);
      const manaAt50 = calculateMana(level, permanentLevel, expiry, time50);
      expect(manaAt50).toBe(55); // 5 + 50 + 0

      // At 75% time remaining
      const time75 = expiry - (VACANCY_PERIOD * 0.75);
      const manaAt75 = calculateMana(level, permanentLevel, expiry, time75);
      expect(manaAt75).toBe(80); // 5 + 75 + 0

      // After expiry
      const timeExpired = expiry + ONE_DAY;
      const manaExpired = calculateMana(level, permanentLevel, expiry, timeExpired);
      expect(manaExpired).toBe(5); // Member Floor only
    });

    it('should handle decay over 90 days correctly', () => {
      const level = 100;
      const permanentLevel = 0;
      const startTime = 1000000;
      const expiry = startTime + VACANCY_PERIOD;

      // After 90 days (half vacancy period)
      const after90Days = startTime + (90 * ONE_DAY);
      const timeRemaining = expiry - after90Days;
      const expectedBonus = Math.floor((level * timeRemaining) / VACANCY_PERIOD);

      const mana = calculateMana(level, permanentLevel, expiry, after90Days);

      expect(mana).toBe(MEMBER_FLOOR + expectedBonus);
      // Should be approximately 55 (5 + 50)
      expect(mana).toBeWithinRange(50, 60);
    });

    it('should handle decay over 180 days correctly', () => {
      const level = 100;
      const permanentLevel = 0;
      const startTime = 1000000;
      const expiry = startTime + VACANCY_PERIOD;

      // After exactly 180 days (full vacancy period)
      const after180Days = startTime + VACANCY_PERIOD;

      const mana = calculateMana(level, permanentLevel, expiry, after180Days);

      expect(mana).toBe(MEMBER_FLOOR);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should calculate Mana for member with Learning Path badge (level 20) after 30 days', () => {
      const level = 20;
      const permanentLevel = 0;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp + VACANCY_PERIOD;
      const thirtyDaysLater = currentTimestamp + (30 * ONE_DAY);

      const mana = calculateMana(level, permanentLevel, expiry, thirtyDaysLater);

      // Time remaining = 150 days out of 180
      // bonus = floor(20 * (150 * ONE_DAY) / VACANCY_PERIOD)
      // ≈ floor(20 * 0.833) ≈ 16
      // Mana ≈ 5 + 16 = 21
      expect(mana).toBeWithinRange(18, 23);
    });

    it('should calculate Mana for Founder (permanent level 100)', () => {
      const level = 100;
      const permanentLevel = 100;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp + VACANCY_PERIOD;
      const oneYearLater = currentTimestamp + (365 * ONE_DAY);

      const mana = calculateMana(level, permanentLevel, expiry, oneYearLater);

      // Founder Mana never decays
      expect(mana).toBe(105);
    });

    it('should calculate Mana for member with multiple badges (level 150) after 60 days', () => {
      const level = 150; // e.g., 3 badges x 50 level each
      const permanentLevel = 0;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp + VACANCY_PERIOD;
      const sixtyDaysLater = currentTimestamp + (60 * ONE_DAY);

      const mana = calculateMana(level, permanentLevel, expiry, sixtyDaysLater);

      // Time remaining = 120 days out of 180 = 66.67%
      // bonus = floor(150 * 0.6667) = floor(100) = 100
      // Mana = 5 + 100 = 105
      expect(mana).toBeWithinRange(95, 110);
    });
  });

  describe('Boundary Conditions', () => {
    it('should not return negative Mana', () => {
      const level = 100;
      const permanentLevel = 0;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp - (1000 * ONE_DAY); // Expired long ago

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      expect(mana).toBeGreaterThanOrEqual(0);
      expect(mana).toBe(MEMBER_FLOOR);
    });

    it('should handle negative time remaining gracefully', () => {
      const level = 100;
      const permanentLevel = 0;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp - 1000;

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      expect(mana).toBe(MEMBER_FLOOR);
    });

    it('should handle level less than permanent level', () => {
      // This shouldn't happen in practice, but test defensive code
      const level = 50;
      const permanentLevel = 100;
      const currentTimestamp = Date.now() / 1000;
      const expiry = currentTimestamp + VACANCY_PERIOD;

      const mana = calculateMana(level, permanentLevel, expiry, currentTimestamp);

      // decayingLevel = max(0, 50 - 100) = 0
      // bonus = 0
      // Mana = 5 + 0 + 100 = 105
      expect(mana).toBe(105);
    });
  });
});
