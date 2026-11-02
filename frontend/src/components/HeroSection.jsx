
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  PlayCircle,
} from "lucide-react";

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-content">
        <span className="hero-tag">
          <GraduationCap size={18} />
          MP Board Learning Platform
        </span>

        <h1>
          Aapke Sapno Ki Udaan,
          <span> Padhai Ke Saath!</span>
        </h1>

        <p>
          Class 6 se 12 tak ki padhai ab hogi aur bhi aasaan.
          Notes padho, video lectures dekho aur online quizzes
          se apni taiyari check karo.
        </p>

        <div className="hero-actions">
          <a href="#classes" className="primary-btn">
            Padhai Shuru Kare <ArrowRight size={18} />
          </a>

          <Link to="/quiz" className="secondary-btn">
            <PlayCircle size={19} /> Quiz Try Kare
          </Link>
        </div>

        <div className="hero-stats">
          <div><strong>7</strong><span>Classes</span></div>
          <div><strong>Hindi</strong><span>Study Material</span></div>
          <div><strong>Free</strong><span>Learning Access</span></div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-circle" />
        <div className="student-illustration">
          <div className="student-head">
            <div className="student-hair" />
            <div className="student-eyes">•　•</div>
            <div className="student-smile" />
          </div>
          <div className="student-shirt">
            <BookOpen size={54} />
          </div>
          <div className="student-book" />
        </div>

        <div className="floating-card top-card">
          <span className="float-icon purple"><BookOpen /></span>
          <div><b>Smart Study</b><small>Learn every day</small></div>
        </div>

        <div className="floating-card bottom-card">
          <span className="float-icon yellow">★</span>
          <div><b>Keep Learning!</b><small>Har din kuch naya</small></div>
        </div>
      </div>
    </section>
  );
}
