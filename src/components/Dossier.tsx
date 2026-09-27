import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  MapPin,
  Users,
  X,
} from 'lucide-react';
import { SKILLS } from '../game/content';
import { decisionError, isAvailable } from '../game/engine';
import type { CaseFile, GameState } from '../game/types';

export default function Dossier({
  file,
  state,
  onClose,
  onSubmit,
}: {
  file: CaseFile;
  state: GameState;
  onClose: () => void;
  onSubmit: (choice: string, staff: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<'decision' | 'assignment'>('decision');
  const [choiceId, setChoiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const choice = file.choices.find((item) => item.id === choiceId);
  const budget = state.resources[file.role];
  const staff = state.staff.filter((item) => item.role === file.role);
  const error = decisionError(state, file.role, file.id, choiceId, staffId);
  const affordable = Boolean(choice && budget >= choice.cost);

  useEffect(() => {
    const element = dialog.current!;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      focused?.focus({ preventScroll: true });
    };
  }, []);

  function changeStep(next: typeof step) {
    setStep(next);
    content.current?.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }
  return (
    <dialog
      ref={dialog}
      className="dossier-modal"
      aria-labelledby="dossier-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <header className="dossier-header">
        <div>
          <span className="eyebrow">
            {step === 'decision' ? '01 / Решение' : '02 / Исполнитель'} ·{' '}
            {file.kind === 'story' ? 'Общее дело' : 'Личное поручение'}
          </span>
          <h2 id="dossier-title" ref={heading} tabIndex={-1}>
            {file.title}
          </h2>
        </div>
        <button className="icon-button" aria-label="Закрыть досье" onClick={onClose}>
          <X size={23} />
        </button>
      </header>
      <div className="dossier-progress" aria-label={`Шаг ${step === 'decision' ? 1 : 2} из 2`}>
        <span className="complete" />
        <span className={step === 'assignment' ? 'complete' : ''} />
      </div>
      <div className="dossier-content" ref={content}>
        {step === 'decision' ? (
          <>
            <div className="dossier-meta">
              <span>Дело {file.reference}</span>
              <span>
                <Briefcase size={14} />
                {file.sender}
              </span>
              <span>
                <MapPin size={14} />
                {file.location}
              </span>
            </div>
            <p className="case-body">{file.body}</p>
            <fieldset>
              <legend>Как поступим?</legend>
              <div className="choices">
                {file.choices.map((item) => (
                  <label
                    className={`choice ${choiceId === item.id ? 'selected' : ''}`}
                    key={item.id}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value={item.id}
                      checked={choiceId === item.id}
                      onChange={() => {
                        setChoiceId(item.id);
                        setStaffId('');
                      }}
                    />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                      <span>
                        {item.skill ? SKILLS[item.skill] : 'Любой сотрудник'}
                        <b>−{item.cost} ресурса</b>
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <>
            <div className="decision-recap">
              <CheckCircle2 size={20} />
              <div>
                <span>Ваше решение</span>
                <strong>{choice?.title}</strong>
                <p>
                  {choice?.skill
                    ? `Нужен навык: ${SKILLS[choice.skill]}`
                    : 'Можно назначить любого свободного сотрудника.'}
                </p>
              </div>
            </div>
            <fieldset>
              <legend>Кто возьмётся за дело?</legend>
              <div className="assignment-grid">
                {staff.map((person) => {
                  const available = isAvailable(person, state.tick);
                  const matches = !choice?.skill || choice.skill === person.skill;
                  return (
                    <button
                      key={person.id}
                      disabled={!available || !matches}
                      className={`assignment ${staffId === person.id ? 'selected' : ''}`}
                      aria-pressed={staffId === person.id}
                      onClick={() => setStaffId(person.id)}
                    >
                      <span className="assignment-top">
                        {staffId === person.id ? <Check size={22} /> : <Users size={22} />}
                      </span>
                      <strong>{person.name}</strong>
                      <span>{SKILLS[person.skill]}</span>
                      <small>
                        {!available
                          ? 'Недоступен до следующей смены'
                          : !matches
                            ? 'Не подходит нужный навык'
                            : 'Свободен · вернётся в следующую смену'}
                      </small>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            {!staff.some(
              (person) =>
                isAvailable(person, state.tick) &&
                (!choice?.skill || choice.skill === person.skill),
            ) && (
              <p className="assignment-help">
                Подходящий сотрудник занят. Вернитесь к выбору решения или закройте дело и завершите
                смену. Нерешённое дело останется во входящих.
              </p>
            )}
          </>
        )}
      </div>
      <footer className="dossier-footer">
        <div className="decision-budget">
          <strong>
            Ресурс: {budget}
            {choice ? ` → ${budget - choice.cost}` : ''}
          </strong>
          <p role="status">
            {step === 'decision'
              ? choice
                ? affordable
                  ? 'Выберите исполнителя на следующем шаге.'
                  : 'Не хватает ресурса для этого решения.'
                : 'Выберите один из вариантов.'
              : (error ?? 'Всё готово. Можно отправлять.')}
          </p>
        </div>
        <div className="decision-actions">
          {step === 'assignment' && (
            <button
              className="decision-back"
              onClick={() => changeStep('decision')}
              aria-label="Назад к выбору решения"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <button
            className="btn-titp"
            disabled={step === 'decision' ? !affordable : Boolean(error)}
            onClick={() => {
              if (step === 'decision') changeStep('assignment');
              else if (!error) onSubmit(choiceId, staffId);
            }}
          >
            {step === 'decision' ? 'Далее: сотрудник' : 'Отправить поручение'}
            <ArrowRight size={18} />
          </button>
        </div>
      </footer>
    </dialog>
  );
}
