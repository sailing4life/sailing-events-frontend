import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getEventStatus } from '../src/utils/eventStatus.ts';

const person = (id, isSkipper = true) => ({ id, is_skipper: isSkipper });
const invitation = (id, status = 'available', role = 'skipper', isSkipper = true) => ({
  id, skipper: person(id, isSkipper), role, status,
});
const boat = (id, response_status = 'pending', skipper) => ({ id, response_status, skipper });
const event = (changes = {}) => ({
  workflow_phase: 'invitation', required_race_directors: 0, required_coaches: 0,
  event_boats: [boat(1)], invitations: [], ...changes,
});

test('enough available people means complete even with unanswered extra invitations', () => {
  const status = getEventStatus(event({ invitations: [invitation(1), invitation(2, 'pending')] }));
  assert.equal(status.label, 'Compleet');
  assert.equal(status.status, 'complete');
  assert.equal(status.hasPending, true);
  assert.equal(status.allConfirmed, false);
});

test('a coach qualified as skipper covers both required roles', () => {
  const status = getEventStatus(event({ required_coaches: 1, invitations: [invitation(1, 'available', 'coach')] }));
  assert.equal(status.isComplete, true);
  assert.equal(status.allConfirmed, false);
});

test('a coach without skipper qualifications does not cover a boat', () => {
  const status = getEventStatus(event({ required_coaches: 1, invitations: [invitation(1, 'available', 'coach', false)] }));
  assert.equal(status.isComplete, false);
});

test('missing a required role is incomplete even with extra skippers', () => {
  const status = getEventStatus(event({ required_race_directors: 1, invitations: [invitation(1), invitation(2)] }));
  assert.equal(status.isComplete, false);
  assert.equal(status.allConfirmed, false);
});

test('not enough available people and a pending invitation means waiting', () => {
  const status = getEventStatus(event({ invitations: [invitation(1, 'pending')] }));
  assert.equal(status.label, 'Wachtend');
  assert.equal(status.status, 'pending');
});

test('unavailable and maybe responses do not fill required roles', () => {
  const status = getEventStatus(event({ event_boats: [boat(1, 'no')], invitations: [
    invitation(1, 'unavailable'), invitation(2, 'maybe'),
  ] }));
  assert.equal(status.available.skippers, 0);
  assert.equal(status.isComplete, false);
  assert.equal(status.label, 'Beschikbaar');
});

test('confirmed requires confirmation of every required role, not just one person', () => {
  const status = getEventStatus(event({ required_race_directors: 1, invitations: [
    invitation(1, 'confirmed'), invitation(2, 'available', 'race_director'),
  ] }));
  assert.equal(status.isComplete, true);
  assert.equal(status.allConfirmed, false);
});

test('confirmed staffing remains complete with extra pending invites', () => {
  const status = getEventStatus(event({ invitations: [invitation(1, 'confirmed'), invitation(2, 'pending')] }));
  assert.equal(status.isComplete, true);
  assert.equal(status.allConfirmed, true);
  assert.equal(status.status, 'complete');
});

test('historical attendance without boats is complete', () => {
  const status = getEventStatus(event({ workflow_phase: 'finalized', event_boats: [], invitations: [invitation(1, 'confirmed')] }));
  assert.equal(status.isComplete, true);
  assert.equal(status.allConfirmed, true);
});

test('empty events are not complete', () => {
  const status = getEventStatus(event({ event_boats: [] }));
  assert.equal(status.isComplete, false);
  assert.equal(status.allConfirmed, false);
});

test('legacy boat responses still count alongside newer role invitations', () => {
  const status = getEventStatus(event({ required_race_directors: 1,
    event_boats: [boat(1, 'yes', person(1))], invitations: [invitation(2, 'confirmed', 'race_director')],
  }));
  assert.equal(status.isComplete, true);
  assert.equal(status.allConfirmed, true);
});

test('legacy assignments and invitations for the same person are counted once', () => {
  const status = getEventStatus(event({ event_boats: [boat(1, 'yes', person(1)), boat(2)], invitations: [invitation(1, 'confirmed')] }));
  assert.equal(status.available.skippers, 1);
  assert.equal(status.isComplete, false);
});

test('legacy boats alone can complete an event', () => {
  assert.equal(getEventStatus(event({ event_boats: [boat(1, 'yes', person(1))] })).isComplete, true);
});

test('the API confirmation state takes precedence over the fallback calculation', () => {
  const status = getEventStatus(event({ is_fully_staffed: false, invitations: [invitation(1, 'confirmed')] }));
  assert.equal(status.isComplete, true);
  assert.equal(status.allConfirmed, false);
});
