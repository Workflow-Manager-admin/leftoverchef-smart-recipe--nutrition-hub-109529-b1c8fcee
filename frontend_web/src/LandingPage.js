import React from "react";
import "./LandingPage.css";

// PUBLIC_INTERFACE
function LandingPage({ onStart }) {
  /**
   * LandingPage - playful animated chef welcome screen
   * @param {function} onStart - callback triggered when Start button is clicked
   *
   * Renders a large animated SVG "smiling chef" and a playful Start button.
   */
  return (
    <div className="landing-bg">
      {/* Animated chef SVG */}
      <div className="chef-anim-container">
        <svg
          className="chef-svg"
          width="300"
          height="320"
          viewBox="0 0 300 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Playful Smiling Chef"
        >
          {/* Chef hat */}
          <ellipse className="chef-hat-bounce" cx="150" cy="70" rx="66" ry="50" fill="#fffefa" stroke="#fbbc05" strokeWidth="8" />
          <ellipse className="chef-hat-fluff" cx="115" cy="50" rx="28" ry="22" fill="#fffefa" opacity="0.93" />
          <ellipse className="chef-hat-fluff" cx="185" cy="50" rx="24" ry="19" fill="#fffefa" opacity="0.93" />
          {/* Head */}
          <ellipse cx="150" cy="160" rx="62" ry="70" fill="#ffe8c3" stroke="#ea4335" strokeWidth="3" />
          {/* Eyes (blinking with animation) */}
          <ellipse className="chef-eye" cx="130" cy="155" rx="9" ry="8" fill="#312f2f" />
          <ellipse className="chef-eye" cx="170" cy="155" rx="9" ry="8" fill="#312f2f" />
          {/* Eyebrow playful arch */}
          <path className="chef-brow-left" d="M117,142 Q130,138 141,143" stroke="#ab6b2f" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path className="chef-brow-right" d="M159,143 Q170,139 183,143" stroke="#ab6b2f" strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* Smile with animated wiggle */}
          <path className="chef-smile"
            d="M127,175 Q150,195 173,175"
            stroke="#ea4335" strokeWidth="6" fill="none" strokeLinecap="round"
          />
          {/* Red nose */}
          <ellipse cx="150" cy="168" rx="10" ry="9" fill="#fbbc05" opacity="0.64" />
          {/* Face blush */}
          <ellipse cx="120" cy="170" rx="7" ry="4" fill="#f25fef" opacity="0.27" />
          <ellipse cx="180" cy="170" rx="7" ry="4" fill="#f25fef" opacity="0.27" />
          {/* Chef jacket */}
          <rect x="97" y="215" rx="18" width="104" height="60" fill="#fff" stroke="#ffd60a" strokeWidth="4" />
          {/* Button on jacket */}
          <circle cx="150" cy="245" r="6.8" fill="#ea4335" />
          {/* Raised spoon in hand (with wave) */}
          <g className="chef-arm-wave">
            <ellipse cx="220" cy="229" rx="17" ry="11" fill="#ffe8c3" />
            <rect x="218" y="198" width="10" height="40" rx="5" fill="#ffe8c3" />
            {/* Spoon */}
            <rect x="222" y="173" width="4" height="32" rx="2" fill="#b87d37" />
            <ellipse cx="224" cy="170" rx="8" ry="6" fill="#ddc49a" />
            <ellipse cx="224" cy="170" rx="4.4" ry="2" fill="#fff4d7" />
          </g>
        </svg>
      </div>
      {/* Animated welcome text */}
      <div className="landing-title">Welcome to <span className="colorful">LeftoverChef!</span></div>
      <div className="landing-subtitle">Your playful, smart recipe & nutrition companion</div>
      {/* Start Button */}
      <button className="landing-start-btn animated-pop" onClick={onStart}>
        <span role="img" aria-label="chef">👨‍🍳</span> Start Cooking!
      </button>
      <div className="landing-credits muted">
        <span role="img" aria-label="sparkle">✨</span> Discover delicious recipes from your leftovers!
      </div>
    </div>
  );
}

export default LandingPage;
