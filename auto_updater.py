import schedule
import time
import os

def run_event_update():
    print("Checking and updating event statuses...")
    os.system("python manage.py update_event_status")


schedule.every(5).minutes.do(run_event_update)

while True:
    schedule.run_pending()
    time.sleep(1)

