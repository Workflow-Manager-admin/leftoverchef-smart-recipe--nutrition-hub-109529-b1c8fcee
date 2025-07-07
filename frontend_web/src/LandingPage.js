import React from "react";
import "./LandingPage.css";

/**
 * PUBLIC_INTERFACE
 * LandingPage - super colorful animated landing page with extra cute (chibi) chef!
 * - Renders on first load, hides only after Start Cooking is pressed.
 * 
 * @param {Object} props
 * @param {function} props.onStart - Called when Start Cooking button is pressed
 */
function LandingPage({ onStart }) {
  // No state or side effects; presentational only.
  return (
    <div className="landing-bg lively-bg">
      {/* Dynamic animated/floating confetti & icons */}
      <div className="confetti-group" aria-hidden="true">
        {/* Bouncing colorful confetti and flying veggies/utensils */}
        <span className="confetti confetti1"></span>
        <span className="confetti confetti2"></span>
        <span className="confetti confetti3"></span>
        <span className="confetti confetti4"></span>
        <span className="confetti veggie-tomato"></span>
        <span className="confetti veggie-broccoli"></span>
        <span className="confetti veggie-carrot"></span>
        <span className="confetti veggie-lemon"></span>
        <span className="confetti utensil-fork"></span>
        <span className="confetti utensil-spoon"></span>
      </div>
      {/* Extra-cute chibi chef illustration */}
      <div className="chef-anim-container">
        <svg
          className="chef-svg chibi-chef-svg"
          width="320"
          height="325"
          viewBox="0 0 320 325"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Adorable Chibi Chef Cartoon"
        >
          {/* Chef hat */}
          <ellipse className="chef-hat-bounce" cx="160" cy="60" rx="68" ry="52" fill="#fffefa" stroke="#fbbc05" strokeWidth="8" />
          <ellipse className="chef-hat-fluff" cx="120" cy="40" rx="25" ry="20" fill="#fffefa" opacity="0.93" />
          <ellipse className="chef-hat-fluff" cx="200" cy="37" rx="27" ry="17" fill="#fffefa" opacity="0.93" />
          {/* Face - extra round, chibi cheeks */}
          <ellipse cx="160" cy="155" rx="76" ry="80" fill="#ffebbf" stroke="#ea4335" strokeWidth="4.2" />
          {/* Ear l/r */}
          <ellipse cx="77" cy="170" rx="16" ry="20" fill="#ffda93" stroke="#ea4335" strokeWidth="2.5" opacity="0.88" />
          <ellipse cx="243" cy="170" rx="15" ry="19" fill="#ffda93" stroke="#ea4335" strokeWidth="2.5" opacity="0.88" />
          {/* Super-big sparkling eyes - left */}
          <ellipse className="chef-eye chibi-eye" cx="125" cy="160" rx="16" ry="17" fill="#2d2926" />
          <ellipse cx="129" cy="155" rx="5" ry="7" fill="#fff" opacity="0.95" />
          <ellipse cx="121" cy="165" rx="3" ry="4" fill="#fff" opacity="0.9" />
          {/* Eye right */}
          <ellipse className="chef-eye chibi-eye" cx="195" cy="160" rx="16" ry="17" fill="#2d2926" />
          <ellipse cx="191" cy="155" rx="5" ry="7" fill="#fff" opacity="0.95" />
          <ellipse cx="199" cy="167" rx="3" ry="4" fill="#fff" opacity="0.8" />
          {/* Kawaii Eyebrows */}
          <path className="chef-brow-left" d="M110,142 Q125,135 140,144" stroke="#c88d41" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path className="chef-brow-right" d="M180,144 Q195,132 218,142" stroke="#c88d41" strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* Very expressive big smile */}
          <path className="chef-smile"
            d="M125,190 Q160,230 201,193"
            stroke="#ea4335" strokeWidth="7" fill="none" strokeLinecap="round"
          />
          {/* Adorable blush */}
          <ellipse cx="110" cy="186" rx="15" ry="7" fill="#f25fef" opacity="0.22" />
          <ellipse cx="210" cy="186" rx="15" ry="7" fill="#f25fef" opacity="0.22" />
          {/* Blushing cheeks highlight */}
          <ellipse cx="106" cy="181" rx="3.9" ry="1.9" fill="#fff4d9" opacity="0.6" />
          <ellipse cx="214" cy="182" rx="2.9" ry="1.1" fill="#fff4d9" opacity="0.6" />
          {/* Button nose */}
          <ellipse cx="160" cy="178" rx="10.7" ry="8.5" fill="#ffd60a" opacity="0.74" />
          {/* Chef jacket - chibi style */}
          <rect x="98" y="225" rx="32" width="128" height="66" fill="#ffffff" stroke="#ffd60a" strokeWidth="4.3" />
          {/* Cheery buttons */}
          <circle cx="160" cy="257" r="8.4" fill="#ea4335" />
          <circle cx="160" cy="272.5" r="5.9" fill="#f25fef" />
          {/* Super bouncy waving arm & spoon */}
          <g className="chef-arm-wave">
            {/* Arm */}
            <ellipse cx="245" cy="235" rx="22" ry="11" fill="#ffebbf" />
            <rect x="240" y="197" width="11" height="55" rx="6" fill="#ffebbf" />
            {/* Waving spoon */}
            <rect x="248" y="174" width="4.2" height="39" rx="2.1" fill="#ce9a3b" />
            <ellipse cx="250" cy="170" rx="10" ry="7" fill="#ffe156" />
            <ellipse cx="250" cy="170" rx="4.6" ry="2.5" fill="#fffbe4" />
          </g>
        </svg>
      </div>
      {/* Animated colorful welcome text */}
      <div className="landing-title">
        Welcome to <span className="colorful">LeftoverChef!</span>
      </div>
      <div className="landing-subtitle">Your playful, smart recipe & nutrition companion</div>
      {/* Upgraded playful Start Button with fun animation */}
      <button
        className="landing-start-btn animated-pop lively-wiggle"
        onClick={() => { if (typeof onStart === "function") onStart(); }} // Defensive: only if onStart present
        aria-label="Start Cooking!"
        onMouseDown={e => {
          // Confetti burst effect for button
          const btn = e.currentTarget;
          btn.classList.add("confetti-burst-active");
          setTimeout(() => btn.classList.remove("confetti-burst-active"), 900);
        }}
        type="button"
      >
        <span className="cheerful-emoji" role="img" aria-label="Cute Chef">🧑‍🍳</span> Start Cooking!
      </button>
      <div className="landing-credits muted">
        <span role="img" aria-label="sparkle">✨</span>
        {" "}Discover delicious recipes from your leftovers!
      </div>
    </div>
  );
}

export default LandingPage;
