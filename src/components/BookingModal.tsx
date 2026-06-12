"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Calendar, Clock, Video, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiquidGlassContainer } from "@/components/ui/liquid-glass-container";
import { GlassButton } from "@/components/ui/apple-tahoe-liquid-glass-button";

interface BookingModalProps {
  defaultOpen?: boolean;
}

const SERVICES = [
  {
    id: "discovery",
    title: "Discovery Call",
    duration: "30 Mins",
    desc: "Discuss your creative business vision, visual content calendar, and digital presence with our founders.",
    color: "oklch(from var(--foreground) l c h / 3%)"
  },
  {
    id: "reels",
    title: "Reels Production Strategy",
    duration: "30 Mins",
    desc: "A deep dive into structural visual strategy, high-retention editing, and portfolio scaling.",
    color: "oklch(from var(--foreground) l c h / 3%)"
  },
  {
    id: "social",
    title: "Full Media Management",
    duration: "30 Mins",
    desc: "Reviewing calendar pacing, demographic targeted audiences, and full operations scaling.",
    color: "oklch(from var(--foreground) l c h / 3%)"
  }
];

export function BookingModal({ defaultOpen = false }: BookingModalProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [step, setStep] = useState(1);
  
  // Selection States
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Lead details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  
  // API Loading & Success States
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [meetUrl, setMeetUrl] = useState("");

  // Listen for global open triggers
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      setName("");
      setEmail("");
      setDetails("");
    };
    window.addEventListener("open-booking-modal", handleOpen);
    return () => window.removeEventListener("open-booking-modal", handleOpen);
  }, []);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const d = String(selectedDate.getDate()).padStart(2, "0");
        const formattedDate = `${y}-${m}-${d}`;
        const res = await fetch(`/api/schedule/slots?date=${formattedDate}`);
        const data = await res.json();
        if (data.slots) {
          setSlots(data.slots);
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate]);

  // Lock background scroll when open. This site uses Locomotive Scroll (Lenis),
  // which hijacks wheel events via its own RAF loop — so `overflow:hidden` alone
  // is NOT enough. We must call lenis.stop() to freeze the virtual scroll, and the
  // scrollable modal panel carries `data-lenis-prevent` so Lenis ignores wheel
  // events inside it and lets the panel scroll natively.
  useEffect(() => {
    const lenis = (window as any).lenis;

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (lenis && typeof lenis.stop === "function") lenis.stop();
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      const l = (window as any).lenis;
      if (l && typeof l.start === "function") l.start();
    };
  }, [isOpen]);

  const handleNextStep = () => setStep((prev) => prev + 1);
  const handlePrevStep = () => setStep((prev) => prev - 1);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    handleNextStep();
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !name || !email) return;

    setBookingInProgress(true);
    try {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${y}-${m}-${d}`;
      const response = await fetch("/api/schedule/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          date: formattedDate,
          time: selectedTime,
          service: selectedService.title,
          details
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMeetUrl(data.googleMeetUrl);
        handleNextStep();
      } else {
        alert(data.error || data.details || "Booking failed. Please try again.");
      }
    } catch (err) {
      console.error("Error booking event:", err);
      alert("Something went wrong. Please check your connection and try again.");
    } finally {
      setBookingInProgress(false);
    }
  };

  // NATIVE CALENDAR GENERATOR (TimeZone-Safe, Zero Stylesheets required)
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDay, totalDays };
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const nextMonth = new Date(prev);
      nextMonth.setMonth(prev.getMonth() + (direction === "prev" ? -1 : 1));
      return nextMonth;
    });
  };

  const { firstDay, totalDays } = getDaysInMonth(currentMonth);
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: totalDays }, (_, i) => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1));
  const calendarCells = [...blanks, ...days];

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today; // slots start from next day only
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  const formattedSelectedDate = selectedDate
    ? selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : "";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* BACKDROP BLUR WITH LIGHT INSET */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/40 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          {/* MAIN MODAL WINDOW */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col lg:flex-row rounded-3xl bg-background border border-border/60 shadow-2xl overflow-hidden focus:outline-none"
          >
            {/* LEFT COLUMN: BRANDING & SUMMARY */}
            <div className="w-full lg:w-2/5 p-6 lg:p-8 bg-card/40 border-b lg:border-b-0 lg:border-r border-border/40 flex flex-col justify-between">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-foreground/[0.04] border border-foreground/[0.04] text-[11px] font-semibold tracking-wider text-foreground/60 uppercase mb-6">
                  Creative Partners
                </span>
                <h2 className="text-2xl font-bold tracking-tight mb-2 text-foreground">OMMI MEDIA</h2>
                <p className="text-sm text-foreground/60 leading-relaxed mb-6">
                  Set up a direct visual discovery meeting with our core execution team.
                </p>

                {/* ACTIVE SUMMARY LIST */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-foreground/[0.03] border border-foreground/[0.04] flex items-center justify-center text-foreground/60">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground/40 font-medium">Service Selected</p>
                      <p className="text-sm font-semibold text-foreground">{selectedService.title}</p>
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-foreground/[0.03] border border-foreground/[0.04] flex items-center justify-center text-foreground/60">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/40 font-medium">Date & Time</p>
                        <p className="text-sm font-semibold text-foreground">
                          {formattedSelectedDate} {selectedTime ? `at ${selectedTime} (IST)` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 text-[11px] text-foreground/30 leading-snug hidden lg:block">
                Questions or custom integrations? Email us directly at <a href="mailto:ommimedia.in@gmail.com" className="underline hover:text-foreground">ommimedia.in@gmail.com</a>
              </div>
            </div>

            {/* RIGHT COLUMN: CORE INTERACTIVE PANEL */}
            <div
              data-lenis-prevent
              className="w-full lg:w-3/5 p-6 lg:p-8 flex flex-col overflow-y-auto overscroll-contain max-h-[65vh] lg:max-h-[85vh]"
            >
              {/* HEADER W/ CLOSE BUTTON */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  {step > 1 && step < 4 && (
                    <button
                      onClick={handlePrevStep}
                      className="w-8 h-8 rounded-full hover:bg-foreground/[0.03] border border-transparent hover:border-foreground/[0.04] flex items-center justify-center text-foreground/60 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  <h3 className="text-base font-semibold text-foreground">
                    {step === 1 && "Choose Service"}
                    {step === 2 && "Select Date & Time"}
                    {step === 3 && "Provide Details"}
                    {step === 4 && "Booking Confirmed"}
                  </h3>
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-foreground/[0.03] border border-foreground/[0.04] hover:bg-foreground/[0.07] flex items-center justify-center text-foreground/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* STEP 1: CHOOSE SERVICE */}
              {step === 1 && (
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  {SERVICES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedService(s);
                        handleNextStep();
                      }}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl border transition-all duration-300 relative group flex items-start gap-4",
                        selectedService.id === s.id
                          ? "bg-foreground/[0.03] border-foreground/30 shadow-sm"
                          : "bg-transparent border-border hover:border-foreground/20"
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-foreground">{s.title}</span>
                          <span className="text-[11px] font-medium text-foreground/40 bg-foreground/[0.03] px-2 py-0.5 rounded-full border border-foreground/[0.04]">
                            {s.duration}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/50 leading-relaxed">{s.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* STEP 2: DATE & TIME PICKER */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  {/* CALENDAR BLOCK */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                        {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMonthChange("prev")}
                          className="w-7 h-7 rounded-full hover:bg-foreground/[0.03] border border-transparent hover:border-foreground/[0.04] flex items-center justify-center text-foreground/60 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMonthChange("next")}
                          className="w-7 h-7 rounded-full hover:bg-foreground/[0.03] border border-transparent hover:border-foreground/[0.04] flex items-center justify-center text-foreground/60 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* WEEKDAYS HEADER */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-foreground/30 uppercase tracking-widest mb-2">
                      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                    </div>

                    {/* CELLS */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarCells.map((cell, idx) => {
                        if (!cell) {
                          return <div key={`empty-${idx}`} className="aspect-square" />;
                        }

                        const date = cell as Date;
                        const isPast = isPastDate(date);
                        const isWeekendDay = isWeekend(date);
                        const isDisabled = isPast || isWeekendDay;
                        const isSelected = selectedDate?.toDateString() === date.toDateString();

                        return (
                          <button
                            key={date.toISOString()}
                            disabled={isDisabled}
                            onClick={() => handleDateSelect(date)}
                            className={cn(
                              "aspect-square rounded-full flex items-center justify-center text-xs font-medium transition-all",
                              isDisabled
                                ? "text-foreground/15 cursor-not-allowed"
                                : isSelected
                                ? "bg-foreground text-background scale-95 shadow-sm font-semibold"
                                : "text-foreground hover:bg-foreground/[0.04] active:scale-95"
                            )}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SLOTS LISTING BLOCK */}
                  {selectedDate && (
                    <div className="border-t border-border/40 pt-5">
                      <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3">
                        Available times for {formattedSelectedDate}
                      </p>

                      {loadingSlots ? (
                        <div className="flex items-center justify-center py-8 gap-2 text-xs text-foreground/50">
                          <Loader2 className="w-4 h-4 animate-spin text-foreground/40" />
                          Checking slots...
                        </div>
                      ) : slots.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {slots.map((t) => (
                            <button
                              key={t}
                              onClick={() => handleTimeSelect(t)}
                              className="px-4 py-2.5 rounded-xl border border-border bg-card/10 hover:bg-foreground/[0.03] hover:border-foreground/30 text-xs font-semibold text-foreground transition-all text-center active:scale-95"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-xs text-foreground/45 border border-dashed border-border rounded-2xl">
                          No slots available on this day. Please select another date.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: LEAD DETAIL FORM */}
              {step === 3 && (
                <form onSubmit={handleBookingSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">
                        Your Full Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-3 rounded-xl bg-card/[0.03] border border-border text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/30 transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">
                        Work Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. john@brand.com"
                        className="w-full px-4 py-3 rounded-xl bg-card/[0.03] border border-border text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/30 transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="details" className="block text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">
                        Project Details / Goals
                      </label>
                      <textarea
                        id="details"
                        rows={3}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Share a brief overview of your business, reels production needs, or social handles..."
                        className="w-full px-4 py-3 rounded-xl bg-card/[0.03] border border-border text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/30 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <GlassButton
                      type="submit"
                      disabled={bookingInProgress}
                      className="w-full py-4 text-sm font-semibold tracking-tight transition-transform"
                    >
                      {bookingInProgress ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Securing Calendar Slot...
                        </span>
                      ) : (
                        "Confirm Discovery Call"
                      )}
                    </GlassButton>
                  </div>
                </form>
              )}

              {/* STEP 4: SUCCESS CONFIRMATION */}
              {step === 4 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="w-16 h-16 rounded-full bg-foreground/[0.03] border border-foreground/[0.05] flex items-center justify-center text-foreground mb-6"
                  >
                    <CheckCircle2 className="w-8 h-8 text-foreground" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">Discovery Call Confirmed!</h3>
                  <p className="text-xs text-foreground/60 leading-relaxed max-w-sm mb-6">
                    We have successfully reserved your slot. A calendar invitation with video call details has been sent to <strong className="text-foreground">{email}</strong>.
                  </p>

                  {/* SUMMARY TICKET */}
                  <div className="w-full max-w-md p-5 rounded-2xl border border-border bg-card/[0.02] text-left space-y-3 mb-8">
                    <div className="flex justify-between border-b border-border/40 pb-2.5">
                      <span className="text-[11px] font-semibold text-foreground/40 uppercase">Interested Service</span>
                      <span className="text-xs font-semibold text-foreground">{selectedService.title}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-2.5">
                      <span className="text-[11px] font-semibold text-foreground/40 uppercase">Scheduled Time</span>
                      <span className="text-xs font-semibold text-foreground">{formattedSelectedDate} at {selectedTime} (IST)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] font-semibold text-foreground/40 uppercase">Video Meeting</span>
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        <a href={meetUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-foreground/80">Google Meet Link</a>
                      </span>
                    </div>
                  </div>

                  <GlassButton
                    onClick={() => setIsOpen(false)}
                    className="px-8 py-3.5 text-xs font-semibold transition-transform"
                  >
                    Exit Booking System
                  </GlassButton>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
