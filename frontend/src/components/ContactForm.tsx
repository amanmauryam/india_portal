"use client";

export default function ContactForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="space-y-4"
    >
      <div>
        <label htmlFor="name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          placeholder="Enter your name"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          placeholder="Enter your email"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600"
        />
      </div>
      <div>
        <label htmlFor="subject" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Subject
        </label>
        <select
          id="subject"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        >
          <option>General Inquiry</option>
          <option>Report Incorrect Link</option>
          <option>Suggest a Service</option>
          <option>Privacy Concern</option>
          <option>Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Message
        </label>
        <textarea
          id="message"
          rows={4}
          placeholder="Type your message here..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 resize-none"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
      >
        Send Message
      </button>
    </form>
  );
}
