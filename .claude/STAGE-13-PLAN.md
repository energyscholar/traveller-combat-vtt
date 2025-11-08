# Stage 13: Performance, Scale & Network Resilience

**Est. 10,000 tokens | ~18 hours | ~950 LOC**

## Scope

### Performance Targets
- 10 concurrent battles
- 5 players + GM per battle
- 10 ships per battle (GM-controlled)
- Total: 60 players, 110 ships concurrent
- Latency: <200ms average
- Combat resolution: <100ms per attack

### Features
- Load testing infrastructure
- Network resilience (reconnection, state sync)
- Performance monitoring
- Optimization: broadcasts, state sync, writes
- Horizontal scaling architecture

### Tests
- Performance tests: ~300 LOC
- Load tests: ~200 LOC
- Network simulation: ~150 LOC

## Sub-Stages

### 13.1: Performance Testing Infrastructure (2k tokens, ~200 LOC)
- Load testing framework (100+ connections)
- Latency simulation (500ms delays)
- Packet loss simulation (5% loss)
- Performance metrics collection
- Dev mode performance dashboard
- Automated regression tests

### 13.2: Network Resilience (2k tokens, ~250 LOC)
- Auto-reconnect on disconnect
- Auto-rejoin battle (restore state)
- Disconnected state indicators (UI)
- State sync recovery (full re-send)
- Action timeout (defaults after 30sec)
- Heartbeat monitoring

### 13.3: Optimization - Broadcasts (2k tokens, ~150 LOC)
- Combat log batching (group updates)
- Debounce rapid updates
- Room-based isolation (Socket.io)
- Selective broadcasts (only relevant players)

### 13.4: Optimization - State Sync (2k tokens, ~150 LOC)
- Delta updates (only changes)
- State compression
- Lazy loading (don't send hidden data)
- State size monitoring (warn >100KB)

### 13.5: Security Hardening (OWASP Top 10) (2k tokens, ~150 LOC)
- **A01: Broken Access Control**
  - Battle room authentication
  - GM vs Player roles
  - Permission system
- **A03: Injection**
  - Input validation all socket events
  - Sanitize user input (ship names, chat)
  - Parameterized queries (when DB added)
- **A05: Security Misconfiguration**
  - helmet.js middleware (security headers)
  - Rate limiting (express-rate-limit)
  - CORS policy
  - Remove server version headers
- **A07: XSS**
  - DOMPurify for user-generated content
  - Content Security Policy headers
  - Escape all output
- **A09: Security Logging**
  - winston logging framework
  - Audit trail (who did what)
  - Intrusion detection basics
- **Security Testing**
  - OWASP ZAP automated scan
  - Penetration testing checklist
  - Security regression tests

### 13.6: Scalability Architecture (1k tokens, ~50 LOC)
- Stateless server design (complete)
- Session state externalization
- Health check endpoints
- Load balancer readiness
- Horizontal scaling prep (documentation)

## Acceptance Criteria
- [ ] 100+ concurrent connections supported
- [ ] Load tests pass (10 battles, 60 players)
- [ ] Latency <200ms under load
- [ ] Reconnection works seamlessly
- [ ] State sync recovers all data
- [ ] Performance metrics visible (dev mode)
- [ ] No memory leaks under sustained load
- [ ] OWASP Top 10 security tests pass
- [ ] Input validation on all socket events
- [ ] XSS protection (sanitized inputs)
- [ ] Rate limiting prevents DOS
- [ ] Security headers configured (helmet.js)
- [ ] Audit logging functional
