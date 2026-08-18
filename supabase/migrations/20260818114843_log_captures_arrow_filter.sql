-- Which direction of a label to capture.
--
-- Request/response labels are logged twice, `==>` then `<==`, and a client
-- claims a capture on the FIRST match it sees — which is always the outbound
-- request. For EventGetCoursesV2 that is a 60-byte `{"request":"{}"}` and the
-- response carrying every course is never captured at all.
--
-- Null or empty means either direction, which is right for the labels that
-- have no arrow (the GRE messages take the decoder's other branch and carry
-- none).
alter table public.log_captures
  add column if not exists arrows text[];
