package com.sw.organiflow.modules.notifications.services;

import com.sw.organiflow.modules.task.models.Task;
import com.sw.organiflow.modules.task.repositories.TaskRepository;
import com.sw.organiflow.shared.enums.TaskStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final TaskRepository taskRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedRate = 900000)
    public void checkOverdueTasks() {
        Instant now = Instant.now();
        List<Task> overdueTasks = taskRepository.findByStatusAndDueAtLessThan(TaskStatus.PENDING, now);

        for (Task task : overdueTasks) {
            try {
                notificationService.notifyTaskOverdue(task);
            } catch (Exception e) {
                log.error("Error notifying overdue task {}: {}", task.getId(), e.getMessage(), e);
            }
        }

        log.info("Overdue notifications processed: {}", overdueTasks.size());
    }

    @Scheduled(fixedRate = 3600000)
    public void checkTasksDueSoon() {
        Instant now = Instant.now();
        Instant tomorrow = now.plus(24, ChronoUnit.HOURS);
        List<Task> dueSoonTasks = taskRepository.findByStatusAndDueAtBetween(TaskStatus.PENDING, now, tomorrow);

        for (Task task : dueSoonTasks) {
            try {
                notificationService.notifyTaskDueSoon(task);
            } catch (Exception e) {
                log.error("Error notifying due soon task {}: {}", task.getId(), e.getMessage(), e);
            }
        }

        log.info("Due soon notifications processed: {}", dueSoonTasks.size());
    }

    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupOldNotifications() {
        long deleted = notificationService.cleanupOldNotifications(Instant.now().minus(90, ChronoUnit.DAYS));
        log.info("Old notifications cleaned up: {}", deleted);
    }
}
